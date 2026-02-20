import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'unmute',
  aliases: ['groupopen'],
  registrationRequired: true,
  description: 'Open group (everyone can send messages)',
  
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

      await sock.groupSettingUpdate(chatId, 'not_announcement');
      
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '🔓 Gruppe geöffnet! Jeder kann jetzt schreiben.' :
          '🔓 Group opened! Everyone can send messages now.', 'unmute', chatId)
      });
    } catch (error) {
      console.error('Error opening group:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Öffnen der Gruppe!' :
          '❌ Error opening group!', 'unmute', chatId)
      });
    }
  }
};
