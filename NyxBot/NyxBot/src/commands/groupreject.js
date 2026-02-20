import { formatMessage, isOwner } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'groupreject',
  registrationRequired: true,
  description: 'Reject group join request (owner only)',
  
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
          'Nutze: .groupreject [anfrage-id]' :
          'Use: .groupreject [request-id]')
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

    delete joinRequests[requestId];
    db.write('joinRequests', joinRequests);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        '✅ Anfrage abgelehnt!' :
        '✅ Request rejected!')
    });

    const requesterJid = request.requester;
    await sock.sendMessage(requesterJid, {
      text: formatMessage(lang === 'de' ? 
        '❌ Deine Gruppenanfrage wurde abgelehnt.' :
        '❌ Your group request was rejected.')
    });
  }
};
