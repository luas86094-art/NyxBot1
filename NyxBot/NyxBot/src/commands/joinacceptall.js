import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'joinacceptall',
  registrationRequired: true,
  description: 'Accept all pending group join requests (admin/owner only)',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    const groupMeta = await sock.groupMetadata(chatId);
    const isAdmin = groupMeta.participants.find(p => p.id === senderId)?.admin;
    const isTeam = hasTeamRank(lid);
    const owner = isOwner(lid, phoneNumber);

    if (!isAdmin && !isTeam && !owner) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'adminOnly'))
      });
      return;
    }

    const requests = db.getGroupJoinRequests(chatId);

    if (requests.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Keine ausstehenden Anfragen!' :
          '❌ No pending requests!')
      });
      return;
    }

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `⏳ Akzeptiere ${requests.length} Anfrage(n)...` :
        `⏳ Accepting ${requests.length} request(s)...`)
    });

    let accepted = 0;
    let failed = 0;

    for (const request of requests) {
      try {
        await sock.groupParticipantsUpdate(chatId, [request.participant], 'approve');
        accepted++;
      } catch (error) {
        console.error(`Error accepting ${request.phoneNumber}:`, error);
        failed++;
      }
    }

    db.clearGroupJoinRequests(chatId);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Fertig!\n\n✔️ Akzeptiert: ${accepted}\n❌ Fehlgeschlagen: ${failed}` :
        `✅ Done!\n\n✔️ Accepted: ${accepted}\n❌ Failed: ${failed}`)
    });
  }
};
