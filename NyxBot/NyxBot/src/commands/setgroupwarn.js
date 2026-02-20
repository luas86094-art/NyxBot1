import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'setgroupwarn',
  registrationRequired: true,
  description: 'Set maximum warnings before kick',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, args, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    try {
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

      if (args.length === 0) {
        const currentLimit = db.getGroupWarnLimit(chatId);
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `⚙️ Aktuelles Warnungslimit: ${currentLimit}\n\nNutze: .setgroupwarn [zahl]` :
            `⚙️ Current warning limit: ${currentLimit}\n\nUse: .setgroupwarn [number]`, 'setgroupwarn', chatId)
        });
        return;
      }

      const limit = parseInt(args[0]);
      
      if (isNaN(limit) || limit < 1 || limit > 10) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            '❌ Bitte gib eine Zahl zwischen 1 und 10 an!' :
            '❌ Please provide a number between 1 and 10!', 'setgroupwarn', chatId)
        });
        return;
      }

      db.setGroupWarnLimit(chatId, limit);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Warnungslimit auf ${limit} gesetzt!\n\nUser werden nach ${limit} ${limit === 1 ? 'Warnung' : 'Warnungen'} gekickt.` :
          `✅ Warning limit set to ${limit}!\n\nUsers will be kicked after ${limit} ${limit === 1 ? 'warning' : 'warnings'}.`, 'setgroupwarn', chatId)
      });
    } catch (error) {
      console.error('Error setting warn limit:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Setzen des Limits!' :
          '❌ Error setting limit!', 'setgroupwarn', chatId)
      });
    }
  }
};
