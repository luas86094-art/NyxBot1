import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'antilink',
  registrationRequired: true,
  description: 'Enable/disable antilink',
  
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
          'Nutze: .antilink enable oder .antilink disable' :
          'Use: .antilink enable or .antilink disable')
      });
      return;
    }

    const action = args[0].toLowerCase();

    if (action === 'enable') {
      db.updateGroup(chatId, { antilink: true });
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ Anti-Link aktiviert! Links werden automatisch gelöscht und der User wird gekickt.' :
          '✅ Anti-link enabled! Links will be deleted and user will be kicked.')
      });
    } else if (action === 'disable') {
      db.updateGroup(chatId, { antilink: false });
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Anti-Link deaktiviert!' :
          '❌ Anti-link disabled!')
      });
    }
  }
};
