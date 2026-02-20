import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

const COOLDOWN_MS = Number(process.env.FISH_COOLDOWN_MS) || 60 * 1000; // default 1 minute
// Simple in-process lock to avoid concurrent runs for same user in this process
const userLocks = new Set();

/**
 * Items: each entry has id, name (de/en), value, emoji, weight
 * - weight = relative chance (higher = more likely)
 * - Add new items by appending a new object here (siehe Anleitung unten)
 */
const ITEMS = [
  { id: 'sardine', name: { de: 'Sardine', en: 'Sardine' }, value: 5, emoji: '🐟', weight: 35 },
  { id: 'trout',   name: { de: 'Forelle',  en: 'Trout'   }, value: 15, emoji: '🐟', weight: 20 },
  { id: 'salmon',  name: { de: 'Lachs',    en: 'Salmon'  }, value: 25, emoji: '🐠', weight: 12 },
  { id: 'tuna',    name: { de: 'Thunfisch',en: 'Tuna'    }, value: 40, emoji: '🐠', weight: 8 },
  { id: 'swordfish', name: { de: 'Schwertfisch', en: 'Swordfish' }, value: 60, emoji: '🐡', weight: 5 },
  { id: 'shark',   name: { de: 'Hai',      en: 'Shark'   }, value: 100, emoji: '🦈', weight: 2 },

  // fail / "nothing" events: value 0
  { id: 'fail_shrug', name: { de: 'Nichts gefunden', en: 'Nothing found' }, value: 0, emoji: '❌️', weight: 10 },
  { id: 'old_shoe', name: { de: 'Alter Schuh', en: 'Old shoe' }, value: 0, emoji: '👞', weight: 5 },
  { id: 'plane_hit', name: { de: 'Vom Flugzeug getroffen', en: 'Hit by a plane' }, value: 0, emoji: '✈️', weight: 3 }
];

/** Weighted random pick */
function pickWeighted(items) {
  const sum = items.reduce((s, it) => s + (it.weight || 0), 0);
  if (sum <= 0) return items[0];
  let r = Math.random() * sum;
  for (const it of items) {
    r -= (it.weight || 0);
    if (r < 0) return it;
  }
  return items[items.length - 1];
}

export default {
  name: 'fish',
  aliases: ['fischen'],
  registrationRequired: true,
  description: 'Go fishing',

  async execute({ sock, chatId, lid, lang }) {
    if (!sock || !chatId || !lid) {
      console.error('fish: missing required execution params', { chatId, lid });
      return;
    }

    // prevent concurrent runs in this process
    if (userLocks.has(lid)) {
      const busyMsg = lang === 'de'
        ? '⏳ Du fischst gerade. Bitte warte einen Moment.'
        : '⏳ You are already fishing. Please wait a moment.';
      try { await sock.sendMessage(chatId, { text: formatMessage(busyMsg, 'fish', chatId) }); } catch (e) { console.error('sendMessage failed', e); }
      return;
    }
    userLocks.add(lid);

    try {
      const user = await Promise.resolve(db.getUser ? db.getUser(lid) : null);
      if (!user) {
        const notReg = lang === 'de' ? '❌ Du bist nicht registriert.' : '❌ You are not registered.';
        await sock.sendMessage(chatId, { text: formatMessage(notReg, 'fish', chatId) });
        return;
      }

      const last = Number(user.lastFish || 0);
      const elapsed = Date.now() - last;
      if (elapsed < COOLDOWN_MS) {
        const leftSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        const waitMsg = lang === 'de'
          ? `⏳ Bitte warte ${leftSec} Sekunde${leftSec > 1 ? 'n' : ''}, bevor du wieder fischst.`
          : `⏳ Please wait ${leftSec} second${leftSec > 1 ? 's' : ''} before fishing again.`;
        await sock.sendMessage(chatId, { text: formatMessage(waitMsg, 'fish', chatId) });
        return;
      }

      // pick item
      const picked = pickWeighted(ITEMS);

      // If your DB implements an atomic tryFish, prefer that.
      // Expected behavior of db.tryFish(lid, reward, cooldownMs): returns { ok: true, user } or { ok:false, waitMs }
      if (typeof db.tryFish === 'function') {
        try {
          const res = await Promise.resolve(db.tryFish(lid, picked.value, COOLDOWN_MS));
          if (!res || !res.ok) {
            const leftSec = Math.ceil((res && res.waitMs ? res.waitMs : COOLDOWN_MS) / 1000);
            const waitMsg = lang === 'de'
              ? `⏳ Bitte warte ${leftSec} Sekunde${leftSec > 1 ? 'n' : ''}, bevor du wieder fischst.`
              : `⏳ Please wait ${leftSec} second${leftSec > 1 ? 's' : ''} before fishing again.`;
            await sock.sendMessage(chatId, { text: formatMessage(waitMsg, 'fish', chatId) });
            return;
          }
          // success: use res.user as updated user
          const updatedUser = res.user;
          const fishName = picked.name[lang === 'de' ? 'de' : 'en'] || picked.name.en;
          const fishText = lang === 'de'
            ? `🎣 *Angeln*\n\nDu hast ${picked.emoji} ${fishName} gefangen!\nWert: ${picked.value}💰\n\nKontostand: ${updatedUser.money}💰`
            : `🎣 *Fishing*\n\nYou caught ${picked.emoji} ${fishName}!\nValue: ${picked.value}💰\n\nBalance: ${updatedUser.money}💰`;
          await sock.sendMessage(chatId, { text: formatMessage(fishText, 'fish', chatId) });
          return;
        } catch (e) {
          console.error('db.tryFish failed, falling back to local update', e);
          // fall through to fallback update below
        }
      }

      // Fallback: update in-process (not atomic across processes)
      // Ensure money numeric
      if (typeof user.money !== 'number' || Number.isNaN(user.money)) user.money = 0;
      user.money += picked.value;
      user.lastFish = Date.now();
      await Promise.resolve(db.updateUser ? db.updateUser(lid, user) : null);

      const fishName = picked.name[lang === 'de' ? 'de' : 'en'] || picked.name.en;
      const fishText = lang === 'de'
        ? `🎣 *Angeln*\n\nDu hast ${picked.emoji} ${fishName} gefangen!\nWert: ${picked.value}💰\n\nKontostand: ${user.money}💰`
        : `🎣 *Fishing*\n\nYou caught ${picked.emoji} ${fishName}!\nValue: ${picked.value}💰\n\nBalance: ${user.money}💰`;

      await sock.sendMessage(chatId, { text: formatMessage(fishText, 'fish', chatId) });
    } catch (err) {
      console.error('fish command error', err);
      try {
        const errMsg = lang === 'de' ? '❌ Ein interner Fehler ist aufgetreten.' : '❌ An internal error occurred.';
        await sock.sendMessage(chatId, { text: formatMessage(errMsg, 'fish', chatId) });
      } catch (sendErr) {
        console.error('failed to send error message in fish command', sendErr);
      }
    } finally {
      userLocks.delete(lid);
    }
  }
};
