import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'join',
  registrationRequired: true,
  description: 'Request bot to join a group (private chat only)',
  
  async execute({ sock, chatId, senderId, lid, args, lang }) {
    const isGroup = chatId.endsWith('@g.us');
    
    if (isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Dieser Befehl funktioniert nur im Privatchat!\n\nSchreibe mir privat: wa.me/491632203359' :
          '❌ This command only works in private chat!\n\nMessage me privately: wa.me/491632203359', 'join', chatId)
      });
      return;
    }

    if (!args[0]) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          'Nutze: .join [gruppenlink]\n\nBeispiel:\n.join https://chat.whatsapp.com/ABC123...' :
          'Use: .join [group-link]\n\nExample:\n.join https://chat.whatsapp.com/ABC123...', 'join', chatId)
      });
      return;
    }

    const link = args[0];
    const settings = db.getSettings();
    const ownerJid = settings.owner + '@s.whatsapp.net';
    
    const joinRequests = db.read('joinRequests');
    const requestId = Date.now().toString();
    joinRequests[requestId] = {
      link,
      requester: senderId,
      requesterId: lid,
      timestamp: Date.now()
    };
    db.write('joinRequests', joinRequests);

    await sock.sendMessage(ownerJid, {
      text: formatMessage(
        `📩 *Neue Gruppenanfrage*\n\n` +
        `Von: @${lid}\n` +
        `Link: ${link}\n` +
        `ID: ${requestId}\n\n` +
        `Nutze:\n` +
        `.groupaccept ${requestId} - Akzeptieren\n` +
        `.groupreject ${requestId} - Ablehnen`
      ),
      mentions: [senderId]
    });

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        '✅ Anfrage wurde an den Owner gesendet!' :
        '✅ Request sent to owner!')
    });
  }
};
