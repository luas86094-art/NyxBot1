import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'goodbye',
  registrationRequired: true,
  description: 'Enable/disable goodbye message',
  
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
          'Nutze: .goodbye enable oder .goodbye disable' :
          'Use: .goodbye enable or .goodbye disable')
      });
      return;
    }

    const action = args[0].toLowerCase();
    const groupData = db.getGroup(chatId);

    if (action === 'enable') {
      groupData.goodbye.enabled = true;
      db.updateGroup(chatId, groupData);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ Abschiedsnachricht aktiviert!' :
          '✅ Goodbye message enabled!')
      });
    } else if (action === 'disable') {
      groupData.goodbye.enabled = false;
      db.updateGroup(chatId, groupData);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Abschiedsnachricht deaktiviert!' :
          '❌ Goodbye message disabled!')
      });
    }
  }
};
