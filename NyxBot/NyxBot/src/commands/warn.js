import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'warn',
  registrationRequired: true,
  description: 'Warn a user',
  
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
          '❌ Markiere einen User zum Warnen!' :
          '❌ Mention a user to warn!', 'warn', chatId)
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
      
      const reason = args.slice(1).join(' ') || (lang === 'de' ? 'Kein Grund angegeben' : 'No reason provided');
      
      const warnCount = db.addWarning(chatId, targetPhone, reason);
      const maxWarns = db.getGroupWarnLimit(chatId);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⚠️ *Warnung ${warnCount}/${maxWarns}*\n\n@${targetPhone} wurde verwarnt!\n\n*Grund:* ${reason}` :
          `⚠️ *Warning ${warnCount}/${maxWarns}*\n\n@${targetPhone} has been warned!\n\n*Reason:* ${reason}`, 'warn', chatId),
        mentions: [targetUser]
      });

      if (warnCount >= maxWarns) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `🔴 @${targetPhone} hat ${maxWarns} Warnungen erreicht und wird gekickt!` :
            `🔴 @${targetPhone} has reached ${maxWarns} warnings and will be kicked!`, 'warn', chatId),
          mentions: [targetUser]
        });

        setTimeout(async () => {
          try {
            await sock.groupParticipantsUpdate(chatId, [targetUser], 'remove');
            db.removeWarnings(chatId, targetPhone);
          } catch (error) {
            console.error('Error kicking warned user:', error);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error warning user:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Warnen!' :
          '❌ Error warning user!', 'warn', chatId)
      });
    }
  }
};
