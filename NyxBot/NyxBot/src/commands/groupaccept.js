import { formatMessage, isOwner } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'groupaccept',
  registrationRequired: true,
  description: 'Accept group join request (owner only)',
  
  async execute({ sock, chatId, phoneNumber, args, lang }) {
    if (!isOwner(lid, phoneNumber)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'ownerOnly'))
      });
      return;
    }

    if (!args[0]) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          'Nutze: .groupaccept [anfrage-id]' :
          'Use: .groupaccept [request-id]')
      });
      return;
    }

    const requestId = args[0];
    const joinRequests = db.read('joinRequests');
    const request = joinRequests[requestId];

    if (!request) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Anfrage nicht gefunden!' :
          '❌ Request not found!')
      });
      return;
    }

    try {
      const inviteCode = request.link.split('/').pop();
      await sock.groupAcceptInvite(inviteCode);
      
      delete joinRequests[requestId];
      db.write('joinRequests', joinRequests);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ Gruppe beigetreten!' :
          '✅ Joined group!')
      });

      const requesterJid = request.requester;
      await sock.sendMessage(requesterJid, {
        text: formatMessage(lang === 'de' ? 
          '✅ Deine Gruppenanfrage wurde akzeptiert!' :
          '✅ Your group request was accepted!')
      });
    } catch (error) {
      console.error('Error joining group:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Beitreten!' :
          '❌ Error joining group!')
      });
    }
  }
};
