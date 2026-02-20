import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import db from '../database/db.js';

/**
 * .reveal / .vv
 * - Reveal a quoted view-once media as a normal media message.
 * - Permission rules implemented as requested:
 *   * If the quoted media was sent by the owner -> NO ONE may reveal it.
 *   * If the quoted media was sent by a team member -> ONLY the owner may reveal it.
 *   * Otherwise -> anyone may reveal.
 *
 * Notes:
 * - This attempts to detect view-once by common Baileys wrappers:
 *   quoted.message.viewOnceMessage OR quoted.message.imageMessage?.viewOnce OR quoted.message.videoMessage?.viewOnce
 * - It tries to resolve sender -> phone (JID before '@') and uses db.getUserByPhone (if available) to check team status.
 * - Adjust db helper names if your DB has different functions.
 */

export default {
  name: 'reveal',
  aliases: ['vv'],
  registrationRequired: true,
  description: 'Reveal view-once media (owner/team permissions apply)',

  async execute({ sock, chatId, quoted, lid, phoneNumber, args = [], lang }) {
    if (!quoted) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? '❌ Markiere eine View-Once Nachricht, die du aufdecken möchtest.' : '❌ Reply to a view-once message you want to reveal.', 'reveal', chatId)
      });
      return;
    }

    try {
      // Detect if quoted is view-once (best-effort)
      const msg = quoted.message || quoted;
      const isViewOnce =
        Boolean(msg && (msg.viewOnceMessage)) ||
        Boolean(msg && msg.imageMessage && msg.imageMessage.viewOnce) ||
        Boolean(msg && msg.videoMessage && msg.videoMessage.viewOnce);

      if (!isViewOnce) {
        await sock.sendMessage(chatId, { text: formatMessage(lang === 'de' ? '❌ Die markierte Nachricht ist kein View-Once-Medium.' : '❌ The quoted message is not a view-once media.', 'reveal', chatId) });
        return;
      }

      // Resolve sender JID / phone
      const qKey = quoted.key || {};
      const senderJid = qKey.participant || qKey.remoteJid || null;
      const senderPhone = senderJid ? String(senderJid).split('@')[0] : null;

      const callerIsOwner = Boolean(lid && typeof isOwner === 'function' && isOwner(lid, phoneNumber));
      let senderIsOwner = false;
      let senderIsTeam = false;

      if (senderPhone && typeof isOwner === 'function') {
        try { senderIsOwner = Boolean(isOwner(null, senderPhone)); } catch (_) { senderIsOwner = false; }
      }

      // Try to resolve sender user via DB if available to check team rank
      if (senderPhone && typeof db.getUserByPhone === 'function') {
        try {
          const senderUser = await Promise.resolve(db.getUserByPhone(senderPhone));
          if (senderUser && typeof hasTeamRank === 'function') {
            const senderLid = senderUser.lid || senderUser.id || null;
            if (senderLid) {
              try { senderIsTeam = Boolean(hasTeamRank(senderLid)); } catch (_) { senderIsTeam = false; }
            }
          }
        } catch (_) {
          senderIsTeam = false;
        }
      } else if (senderPhone && typeof db.getUser === 'function') {
        // best-effort fallback: try db.getUser with phone as key
        try {
          const senderUser = await Promise.resolve(db.getUser(senderPhone));
          if (senderUser && typeof hasTeamRank === 'function') {
            const senderLid = senderUser.lid || senderUser.id || null;
            if (senderLid) {
              try { senderIsTeam = Boolean(hasTeamRank(senderLid)); } catch (_) { senderIsTeam = false; }
            }
          }
        } catch (_) {
          senderIsTeam = false;
        }
      }

      // Enforce permission rules
      if (senderIsOwner) {
        const msgText = lang === 'de' ? '❌ View-once Medien vom Owner dürfen nicht enthüllt werden.' : '❌ View-once media sent by the owner cannot be revealed.';
        await sock.sendMessage(chatId, { text: formatMessage(msgText, 'reveal', chatId) });
        return;
      }

      if (senderIsTeam && !callerIsOwner) {
        const msgText = lang === 'de' ? '❌ Nur der Owner darf View-once Medien von Team-Mitgliedern enthüllen.' : '❌ Only the owner may reveal view-once media sent by team members.';
        await sock.sendMessage(chatId, { text: formatMessage(msgText, 'reveal', chatId) });
        return;
      }

      // Allowed: proceed to download the media buffer
      await sock.sendMessage(chatId, { text: formatMessage(lang === 'de' ? '⏳ Versuche das View-once-Medium herunterzuladen...' : '⏳ Attempting to download the view-once media...', 'reveal', chatId) });

      let mediaBuffer;
      try {
        mediaBuffer = await sock.downloadMediaMessage(quoted);
      } catch (e1) {
        try { mediaBuffer = await sock.downloadMediaMessage(quoted.message || quoted); } catch (e2) { throw new Error('download failed'); }
      }

      if (!mediaBuffer || !mediaBuffer.length) throw new Error('no media buffer');

      // Determine mime type from quoted/message structure best-effort
      const mime =
        (msg.imageMessage && msg.imageMessage.mimetype) ||
        (msg.videoMessage && msg.videoMessage.mimetype) ||
        (msg.documentMessage && msg.documentMessage.mimetype) ||
        quoted.mimetype || '';

      // Send appropriate message depending on mime
      if (mime && mime.startsWith('image')) {
        await sock.sendMessage(chatId, { image: mediaBuffer, caption: formatMessage(lang === 'de' ? '🔓 View-once (enthüllt)' : '🔓 View-once revealed', 'reveal', chatId) });
      } else if (mime && mime.startsWith('video')) {
        await sock.sendMessage(chatId, { video: mediaBuffer, caption: formatMessage(lang === 'de' ? '🔓 View-once (enthüllt)' : '🔓 View-once revealed', 'reveal', chatId) });
      } else {
        // fallback to document
        await sock.sendMessage(chatId, { document: mediaBuffer, fileName: 'revealed_media', mimetype: mime || 'application/octet-stream', caption: formatMessage(lang === 'de' ? '🔓 View-once (enthüllt)' : '🔓 View-once revealed', 'reveal', chatId) });
      }
    } catch (err) {
      console.error('reveal command error', err);
      const fallback = lang === 'de' ? '❌ Konnte das View-once-Medium nicht enthüllen.' : '❌ Could not reveal the view-once media.';
      try { await sock.sendMessage(chatId, { text: formatMessage(fallback, 'reveal', chatId) }); } catch (_) {}
    }
  }
};
