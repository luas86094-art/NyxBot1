import { formatMessage, isOwner } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'selfpromote',
  registrationRequired: true,
  description: 'Make yourself admin (Owner only)',
  
  async execute({ sock, chatId, senderId, phoneNumber, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    const owner = isOwner(lid, phoneNumber);

    if (!owner) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nur der Owner kann diesen Befehl nutzen!' :
          '❌ Only the owner can use this command!', 'selfpromote', chatId)
      });
      return;
    }

    try {
      const groupMeta = await sock.groupMetadata(chatId);
      const isAlreadyAdmin = groupMeta.participants.find(p => p.id === senderId)?.admin;

      if (isAlreadyAdmin) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            '✅ Du bist bereits Admin!' :
            '✅ You are already an admin!', 'selfpromote', chatId)
        });
        return;
      }

      await sock.groupParticipantsUpdate(chatId, [senderId], 'promote');
      
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ Du wurdest zum Admin befördert!' :
          '✅ You have been promoted to admin!', 'selfpromote', chatId)
      });
    } catch (error) {
      console.error('Error promoting self:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Befördern! Stelle sicher, dass der Bot Admin ist.' :
          '❌ Error promoting! Make sure the bot is an admin.', 'selfpromote', chatId)
      });
    }
  }
};
