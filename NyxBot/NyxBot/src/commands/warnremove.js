import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'warnremove',
  registrationRequired: true,
  description: 'Remove warnings from a user',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, mentions, args, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Markiere einen User, dessen Warnungen entfernt werden sollen!' :
          '❌ Mention a user whose warnings should be removed!', 'warnremove', chatId)
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

      const targetUser = mentions[0];
      const targetPhone = targetUser.split('@')[0];
      
      const userWarnings = db.getWarnings(chatId, targetPhone);
      
      if (!userWarnings) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `❌ @${targetPhone} hat keine Warnungen!` :
            `❌ @${targetPhone} has no warnings!`, 'warnremove', chatId),
          mentions: [targetUser]
        });
        return;
      }

      let amount = null;
      if (args.length > 1) {
        amount = parseInt(args[1]);
        if (isNaN(amount) || amount < 1) {
          await sock.sendMessage(chatId, {
            text: formatMessage(lang === 'de' ? 
              '❌ Bitte gib eine gültige Zahl an!' :
              '❌ Please provide a valid number!', 'warnremove', chatId)
          });
          return;
        }
      }

      const currentCount = userWarnings.count;
      db.removeWarnings(chatId, targetPhone, amount);

      if (amount === null || amount >= currentCount) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `✅ Alle Warnungen von @${targetPhone} wurden entfernt!` :
            `✅ All warnings from @${targetPhone} have been removed!`, 'warnremove', chatId),
          mentions: [targetUser]
        });
      } else {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `✅ ${amount} ${amount === 1 ? 'Warnung' : 'Warnungen'} von @${targetPhone} wurde(n) entfernt! (${currentCount - amount} verbleiben)` :
            `✅ ${amount} ${amount === 1 ? 'warning' : 'warnings'} from @${targetPhone} removed! (${currentCount - amount} remaining)`, 'warnremove', chatId),
          mentions: [targetUser]
        });
      }
    } catch (error) {
      console.error('Error removing warnings:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Entfernen der Warnungen!' :
          '❌ Error removing warnings!', 'warnremove', chatId)
      });
    }
  }
};
