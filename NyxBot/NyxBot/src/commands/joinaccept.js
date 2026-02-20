import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'joinaccept',
  registrationRequired: true,
  description: 'Accept a group join request (admin/owner only)',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, args, isGroup, lang }) {
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

    if (!args[0]) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .joinaccept [index]\n\nVerwende .joinlist um alle Anfragen zu sehen.' :
          '❌ Use: .joinaccept [index]\n\nUse .joinlist to see all requests.')
      });
      return;
    }

    const index = parseInt(args[0]) - 1;
    const requests = db.getGroupJoinRequests(chatId);
    
    if (isNaN(index) || index < 0 || index >= requests.length) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Ungültiger Index! Nutze .joinlist um alle Anfragen zu sehen.` :
          `❌ Invalid index! Use .joinlist to see all requests.`)
      });
      return;
    }
    
    const request = requests[index];

    if (!request) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Keine Anfrage von ${phoneNumber} gefunden!` :
          `❌ No request found from ${phoneNumber}!`)
      });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(chatId, [request.participant], 'approve');
      
      db.removeGroupJoinRequest(chatId, request.phoneNumber);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Anfrage von @${request.phoneNumber} wurde akzeptiert!` :
          `✅ Request from @${request.phoneNumber} has been accepted!`),
        mentions: [request.participant]
      });
    } catch (error) {
      console.error('Error accepting join request:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Fehler beim Akzeptieren der Anfrage! Möglicherweise wurde sie bereits bearbeitet.` :
          `❌ Error accepting request! It may have already been processed.`)
      });
    }
  }
};
