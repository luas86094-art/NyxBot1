import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'welcome',
  registrationRequired: true,
  description: 'Enable/disable welcome message',
  
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
          'Nutze: .welcome enable oder .welcome disable' :
          'Use: .welcome enable or .welcome disable')
      });
      return;
    }

    const action = args[0].toLowerCase();
    const groupData = db.getGroup(chatId);

    if (action === 'enable') {
      groupData.welcome.enabled = true;
      db.updateGroup(chatId, groupData);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ Willkommensnachricht aktiviert!' :
          '✅ Welcome message enabled!')
      });
    } else if (action === 'disable') {
      groupData.welcome.enabled = false;
      db.updateGroup(chatId, groupData);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Willkommensnachricht deaktiviert!' :
          '❌ Welcome message disabled!')
      });
    }
  }
};
