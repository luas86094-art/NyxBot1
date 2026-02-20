import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'demote',
  registrationRequired: true,
  description: 'Demote user from admin',
  
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
          '❌ Markiere einen User zum Degradieren!' :
          '❌ Mention a user to demote!', 'demote', chatId)
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

      await sock.groupParticipantsUpdate(chatId, mentions, 'demote');
      
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ User wurde von Admin degradiert!' :
          '✅ User has been demoted from admin!', 'demote', chatId),
        mentions
      });
    } catch (error) {
      console.error('Error demoting user:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Degradieren! Stelle sicher, dass der Bot Admin ist.' :
          '❌ Error demoting! Make sure the bot is an admin.', 'demote', chatId)
      });
    }
  }
};
