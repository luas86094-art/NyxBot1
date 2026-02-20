import { formatMessage, randomInt } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'fosh',
  aliases: ['foschen'],
  registrationRequired: true,
  description: 'Go foshing',

  async execute({ sock, chatId, lid, lang }) {
    try {
      const user = db.getUser(lid);
      if (!user) {
        const notReg = lang === 'de'
          ? '❌ Du bist nicht registriert.'
          : '❌ You are not registered.';
        await sock.sendMessage(chatId, { text: formatMessage(notReg, 'fosh', chatId) });
        return;
      }

      // --- COOLDOWN: 60 Sekunden ---
      const COOLDOWN_MS = 30 * 60 * 1000; // 1 Minute
      const last = user.lastFosh || 0;
      const elapsed = Date.now() - last;
      if (elapsed < COOLDOWN_MS) {
        const leftSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        const waitMsg = lang === 'de'
          ? `⏳ Bitte warte ${leftSec} Sekunde${leftSec > 1 ? 'n' : ''}, bevor du wieder foshst.`
          : `⏳ Please wait ${leftSec} second${leftSec > 1 ? 's' : ''} before foshing again.`;
        await sock.sendMessage(chatId, { text: formatMessage(waitMsg, 'fosh', chatId) });
        return;
      }
      // -----------------------------------

      const foshes = [
        { name: lang === 'de' ? 'Kugelfisch' : 'Pufferfish', value: 500, emoji: '🐡' },
        { name: lang === 'de' ? 'Krake' : 'Octopus', value: 1500, emoji: '🐙' },
        { name: lang === 'de' ? 'Koralle' : 'Coral', value: 2500, emoji: '🪸' },
        { name: lang === 'de' ? 'Muschel' : 'Shell', value: 1000, emoji: '🐚' },
        { name: lang === 'de' ? 'Shrimps' : 'Shrimp', value: 600, emoji: '🦐' },
        { name: lang === 'de' ? 'Robbe' : 'Seal', value: 10000, emoji: '🦭' }
      ];

      // randomInt inclusive; nutzen wir 0..99 für die Prozent-Logik
      const random = randomInt(0, 99);
      let caught;

      if (random < 40) caught = foshes[0];
      else if (random < 65) caught = foshes[1];
      else if (random < 80) caught = foshes[2];
      else if (random < 90) caught = foshes[3];
      else if (random < 97) caught = foshes[4];
      else caught = foshes[5];

      // Stelle sicher, dass money existiert
      if (typeof user.money !== 'number') user.money = 0;
      user.money += caught.value;

      // Update lastFosh timestamp and save user
      user.lastFosh = Date.now();
      db.updateUser(lid, user);

      const foshText = lang === 'de' ?
        `🎣 *Foshing*\n\nDu hast ${caught.emoji} ${caught.name} gefangen!\nWert: ${caught.value}💰\n\nKontostand: ${user.money}💰` :
        `🎣 *Foshing*\n\nYou caught ${caught.emoji} ${caught.name}!\nValue: ${caught.value}💰\n\nBalance: ${user.money}💰`;

      await sock.sendMessage(chatId, {
        text: formatMessage(foshText, 'fosh', chatId)
      });
    } catch (_) {
      try {
        const errMsg = lang === 'de' ? '❌ Ein interner Fehler ist aufgetreten.' : '❌ An internal error occurred.';
        await sock.sendMessage(chatId, { text: formatMessage(errMsg, 'fosh', chatId) });
      } catch (_) { /* silent */ }
    }
  }
};
