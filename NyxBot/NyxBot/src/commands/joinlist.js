import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

function getTimeAgo(timestamp, lang) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) {
    return lang === 'de' ? `vor ${seconds} Sekunden` : `${seconds} seconds ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return lang === 'de' ? `vor ${minutes} Minuten` : `${minutes} minutes ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === 'de' ? `vor ${hours} Stunden` : `${hours} hours ago`;
  }
  
  const days = Math.floor(hours / 24);
  return lang === 'de' ? `vor ${days} Tagen` : `${days} days ago`;
}

export default {
  name: 'joinlist',
  registrationRequired: true,
  description: 'List all pending group join requests (admin/owner only)',
  
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
          '📋 Keine ausstehenden Beitrittsanfragen!' :
          '📋 No pending join requests!')
      });
      return;
    }

    let listText = lang === 'de' ?
      `📋 *Ausstehende Beitrittsanfragen* (${requests.length})\n\n` :
      `📋 *Pending Join Requests* (${requests.length})\n\n`;

    requests.forEach((request, index) => {
      const timeAgo = getTimeAgo(request.requestedAt, lang);
      listText += `${index + 1}. ${request.phoneNumber}\n`;
      listText += `   ⏰ ${timeAgo}\n\n`;
    });

    listText += lang === 'de' ?
      `\n*Befehle:*\n` +
      `• .joinaccept [index]\n` +
      `• .joinreject [index]\n` +
      `• .joinacceptall\n` +
      `• .joinrejectall` :
      `\n*Commands:*\n` +
      `• .joinaccept [index]\n` +
      `• .joinreject [index]\n` +
      `• .joinacceptall\n` +
      `• .joinrejectall`;

    await sock.sendMessage(chatId, {
      text: formatMessage(listText)
    });
  }
};
