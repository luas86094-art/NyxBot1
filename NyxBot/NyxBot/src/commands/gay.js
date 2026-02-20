import { formatMessage, isOwner } from '../utils/helpers.js';

/**
 * .gay @user
 * - Progress animation always goes to 100% then shows final gayscore
 * - Owner special: if the target is the owner (or caller is owner and no target provided),
 *   the target gets an "infinite" gayscore (displayed as ∞%)
 * - Adds comments depending on the final percent in 10% steps (negative -> positive)
 * - Uses edit: sent.key like your ping command with delete+send fallback
 */

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeBar(percent, length = 12) {
  const filled = Math.round((percent / 100) * length);
  const full = '█'.repeat(Math.max(0, Math.min(length, filled)));
  const empty = '░'.repeat(Math.max(0, length - filled));
  return `[${full}${empty}]`;
}

function biasedPercent(exp = 0.4) {
  // exp < 1 => bias towards higher numbers; exp > 1 => bias towards lower numbers
  const r = Math.random();
  const v = Math.pow(r, exp);
  return Math.max(0, Math.min(100, Math.round(v * 100)));
}

function getCommentForPercent(pct, lang = 'en') {
  // map 0-9 -> index 0, 10-19 -> 1, ... 100 -> 10
  const idx = Math.min(10, Math.floor(pct / 10));
  const comments_en = [
    "Oof... that's really not it🙄",
    "Still weak, you like being a loser, huh👀",
    "Low, come on - curiosity doesn't hurt😝",
    "Come on, you need to show colors!🌈",
    "Nice! You're showing some colors⚡️",
    "Pretty gay! Keep shining🌟",
    "Very gay — loving the energy🔥",
    "Super gay — rainbow levels rising!🎉",
    "Absolutely fabulous — iconic!🥳",
    "Legendary gay energy! ❤🌈",
    "Peak fabulousness — dazzling!🏳️‍🌈🎉✨️"
  ];
  const comments_de = [
    "Oof... das ist wirklich nicht so🙄",
    "Immer noch schwach, du bist gerne ein looser, huh👀",
    "Niedrig, komm schon - Neugier tut nicht weh😝",
    "Komm, du musst Farben zeigen!🌈",
    "Nice! Du zeigst ein paar Farben⚡️",
    "Ganz schön gay! Weiter so🌟",
    "Sehr gay — tolle Energie🔥",
    "Super gay — Regenbogen-Level steigt!🎉",
    "Absolut fabelhaft — ikonisch!🥳",
    "Legendäre Gay-Energie! ❤🌈",
    "Maximale Fabelhaftigkeit — atemberaubend!🏳️‍🌈🎉✨️"
  ];
  return lang === 'de' ? comments_de[idx] : comments_en[idx];
}

export default {
  name: 'gay',
  aliases: ['gaymeter', 'gayscore'],
  registrationRequired: false,
  description: 'Fun: measure how gay someone is — progress bar, owner special, and comments',

  async execute({ sock, chatId, args = [], mentions = [], message, lang }) {
    try {
      // derive senderId and target
      const senderId = message?.key?.participant || message?.key?.remoteJid || null;
      const targetJid = Array.isArray(mentions) && mentions.length ? mentions[0] : null;

      // mention array: include sender and target (unique, no null)
      const mentionSet = new Set();
      if (senderId) mentionSet.add(senderId);
      if (targetJid) mentionSet.add(targetJid);
      const mentionArray = Array.from(mentionSet);

      const senderLid = senderId ? String(senderId).split('@')[0] : null;
      const targetLid = targetJid ? String(targetJid).split('@')[0] : null;

      let displayName = '';
      if (targetJid) displayName = `@${targetLid}`;
      else if (args && args.length) displayName = args.join(' ');
      else if (senderLid) displayName = `@${senderLid}`;
      else displayName = lang === 'de' ? 'Du' : 'You';

      // Config with validation
      let barLength = Number(process.env.GAY_BAR_LENGTH) || 12;
      if (!Number.isFinite(barLength) || barLength < 4) barLength = 12;
      if (barLength > 30) barLength = 30;

      let biasExp = Number(process.env.GAY_BIAS_EXP);
      if (!Number.isFinite(biasExp) || biasExp <= 0) biasExp = 0.4;

      // Determine owner status:
      // - If the target is the owner -> target gets infinite score
      // - Else if no target and the caller is owner -> caller gets infinite score
      const targetIsOwner = targetLid && typeof isOwner === 'function' && isOwner(targetLid);
      const callerIsOwner = senderLid && typeof isOwner === 'function' && isOwner(senderLid);
      const ownerInfinite = Boolean(targetIsOwner || (!targetJid && callerIsOwner));

      // We still run a full progress sequence up to 100% always
      const progressSeq = [];
      let cur = 0;
      while (cur < 100) {
        const remaining = 100 - cur;
        let step = randInt(6, 18);
        if (remaining <= 20) step = randInt(3, Math.max(3, remaining));
        const next = Math.min(100, cur + step);
        if (next === cur) break;
        progressSeq.push(next);
        cur = next;
      }
      if (progressSeq.length === 0) progressSeq.push(100);

      // send initial (loading 0%)
      const initialText = (lang === 'de')
        ? `invisible Bot gay measurement:\ngayscore: loading (0%) ${makeBar(0, barLength)}`
        : `invisible Bot gay measurement:\ngayscore: loading (0%) ${makeBar(0, barLength)}`;

      let lastSent = null;
      try {
        lastSent = await sock.sendMessage(chatId, { text: formatMessage(initialText, 'gay', chatId), mentions: mentionArray });
      } catch (e) {
        console.warn('gay: initial send failed', e && e.message);
      }

      // animate progress up to 100%
      for (let i = 0; i < progressSeq.length; i++) {
        const p = progressSeq[i];
        const waitMin = 400;
        const waitMax = 1200 + Math.floor((p / 100) * 600);
        await sleep(randInt(waitMin, waitMax));

        const isFinalStep = p === 100;
        const progressText = isFinalStep
          ? (lang === 'de' ? `${displayName}\ngayscore: Loading completed! ${makeBar(100, barLength)}` : `${displayName}\ngayscore: Loading completed! ${makeBar(100, barLength)}`)
          : (lang === 'de' ? `${displayName}\ngayscore: loading (${p}%) ${makeBar(p, barLength)}` : `${displayName}\ngayscore: loading (${p}%) ${makeBar(p, barLength)}`);

        let editedOk = false;
        if (lastSent && lastSent.key) {
          try {
            const res = await sock.sendMessage(chatId, { text: formatMessage(progressText, 'gay', chatId), edit: lastSent.key, mentions: mentionArray });
            if (res) lastSent = res;
            editedOk = true;
          } catch (editErr) {
            console.warn('gay: edit failed, will fallback to delete+send', editErr && editErr.message);
          }
        }

        if (!editedOk) {
          try {
            if (lastSent && lastSent.key) {
              await sock.sendMessage(chatId, { delete: lastSent.key }).catch(() => null);
            }
            const newSent = await sock.sendMessage(chatId, { text: formatMessage(progressText, 'gay', chatId), mentions: mentionArray });
            if (newSent) lastSent = newSent;
          } catch (fallbackErr) {
            console.warn('gay: fallback send failed', fallbackErr && fallbackErr.message);
          }
        }
      }

      // now compute final result
      let finalPercent = biasedPercent(biasExp);
      let finalPercentDisplay = `${finalPercent}%`;
      let finalComment = getCommentForPercent(finalPercent, lang);

      if (ownerInfinite) {
        // owner gets infinite gayscore and a special comment
        finalPercentDisplay = '∞%';
        finalComment = lang === 'de' ? 'Owner detected — unendliche Gay-Power! 👑🌈' : 'Owner detected — infinite gay power! 👑🌈';
      }

      // short pause then show final result (replace the 100% message)
      await sleep(500 + randInt(100, 400));
      const finalText = (lang === 'de')
        ? `🔎 Messung abgeschlossen!\n${displayName}\ngayscore: 🏳️‍🌈 ${finalPercentDisplay}\n${makeBar(ownerInfinite ? 100 : finalPercent, barLength)} 🌈\n\n${finalComment}`
        : `🔎 Measurement complete!\n${displayName}\ngayscore: 🏳️‍🌈 ${finalPercentDisplay}\n${makeBar(ownerInfinite ? 100 : finalPercent, barLength)} 🌈\n\n${finalComment}`;

      if (lastSent && lastSent.key) {
        try {
          const res = await sock.sendMessage(chatId, { text: formatMessage(finalText, 'gay', chatId), edit: lastSent.key, mentions: mentionArray });
          if (res) lastSent = res;
        } catch (editErr) {
          try {
            await sock.sendMessage(chatId, { delete: lastSent.key }).catch(() => null);
            const res2 = await sock.sendMessage(chatId, { text: formatMessage(finalText, 'gay', chatId), mentions: mentionArray });
            if (res2) lastSent = res2;
          } catch (sendErr) {
            console.warn('gay: final send failed', sendErr && sendErr.message);
          }
        }
      } else {
        await sock.sendMessage(chatId, { text: formatMessage(finalText, 'gay', chatId), mentions: mentionArray });
      }
    } catch (err) {
      console.error('gay command error', err);
      try {
        const fail = lang === 'de' ? '❌ Fehler beim Ausführen des Befehls.' : '❌ Error executing command.';
        await sock.sendMessage(chatId, { text: formatMessage(fail, 'gay', chatId) });
      } catch (_) {}
    }
  }
};
