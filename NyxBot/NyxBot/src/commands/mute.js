import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'mute',
  aliases: ['groupclose'],
  registrationRequired: true,
  description: 'Close group (only admins can send messages)',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, isGroup, lang }) {
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

      await sock.groupSettingUpdate(chatId, 'announcement');
      
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '🔒 Gruppe geschlossen! Nur Admins können jetzt schreiben.' :
          '🔒 Group closed! Only admins can send messages now.', 'mute', chatId)
      });
    } catch (error) {
      console.error('Error closing group:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Schließen der Gruppe!' :
          '❌ Error closing group!', 'mute', chatId)
      });
    }
  }
};
