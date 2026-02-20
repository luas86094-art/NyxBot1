import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'kick',
  registrationRequired: true,
  description: 'Kick a user from group',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, mentions, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          'Markiere einen User zum Kicken!' :
          'Mention a user to kick!')
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

      await sock.groupParticipantsUpdate(chatId, mentions, 'remove');
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ User wurde gekickt!' :
          '✅ User was kicked!'),
        mentions
      });
    } catch (error) {
      console.error('Error kicking user:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Kicken!' :
          '❌ Error kicking user!')
      });
    }
  }
};
