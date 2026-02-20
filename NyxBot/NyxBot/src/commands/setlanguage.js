import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { LANG_NAMES, getLanguageCode, msg } from '../utils/languageHelper.js';
import db from '../database/db.js';

const supportedLanguages = ['en', 'de', 'es', 'fr', 'it', 'tr', 'ar', 'ja', 'kr', 'ru', 'cs'];

export default {
  name: 'setlanguage',
  registrationRequired: true,
  description: 'Set chat language',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, args, isGroup, lang }) {
    if (!args[0]) {
      const langList = supportedLanguages.map(l => LANG_NAMES[l]).join('\n');
      const message = await msg(lang,
        `🌍 Available languages:\n\n${langList}\n\nUse: .setlanguage [language]\nExample: .setlanguage english`,
        `🌍 Verfügbare Sprachen:\n\n${langList}\n\nNutze: .setlanguage [sprache]\nBeispiel: .setlanguage deutsch`
      );
      
      await sock.sendMessage(chatId, {
        text: formatMessage(message, 'setlanguage', chatId)
      });
      return;
    }

    const input = args.join(' ');
    const newLang = getLanguageCode(input);
    
    if (!newLang || !supportedLanguages.includes(newLang)) {
      const langList = supportedLanguages.map(l => LANG_NAMES[l]).join(', ');
      const message = await msg(lang,
        `❌ Invalid language!\n\nAvailable: ${langList}`,
        `❌ Ungültige Sprache!\n\nVerfügbar: ${langList}`
      );
      
      await sock.sendMessage(chatId, {
        text: formatMessage(message, 'setlanguage', chatId)
      });
      return;
    }

    if (isGroup) {
      const groupMeta = await sock.groupMetadata(chatId);
      const isAdmin = groupMeta.participants.find(p => p.id === senderId)?.admin;
      const isTeam = hasTeamRank(lid);
      const owner = isOwner(lid, phoneNumber);

      if (!isAdmin && !isTeam && !owner) {
        const message = await msg(lang,
          '❌ Only admins and bot team can change the language!',
          '❌ Nur Admins und Bot-Team können die Sprache ändern!'
        );
        
        await sock.sendMessage(chatId, {
          text: formatMessage(message, 'setlanguage', chatId)
        });
        return;
      }

      db.updateGroup(chatId, { language: newLang });
    }

    const message = await msg(lang,
      `✅ Language changed to ${LANG_NAMES[newLang]}!`,
      `✅ Sprache wurde auf ${LANG_NAMES[newLang]} geändert!`
    );

    await sock.sendMessage(chatId, {
      text: formatMessage(message, 'setlanguage', chatId)
    });
  }
};
