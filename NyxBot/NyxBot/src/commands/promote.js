import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'promote',
  registrationRequired: true,
  description: 'Promote user to admin',
  
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
          '❌ Markiere einen User zum Befördern!' :
          '❌ Mention a user to promote!', 'promote', chatId)
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

      await sock.groupParticipantsUpdate(chatId, mentions, 'promote');
      
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ User wurde zum Admin befördert!' :
          '✅ User has been promoted to admin!', 'promote', chatId),
        mentions
      });
    } catch (error) {
      console.error('Error promoting user:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Befördern! Stelle sicher, dass der Bot Admin ist.' :
          '❌ Error promoting! Make sure the bot is an admin.', 'promote', chatId)
      });
    }
  }
};
