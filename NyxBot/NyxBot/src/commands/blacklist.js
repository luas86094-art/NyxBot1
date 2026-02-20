import { formatMessage, isOwner } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'blacklist',
  registrationRequired: true,
  description: 'Manage blacklist (owner only)',
  
  async execute({ sock, chatId, phoneNumber, args, lang }) {
    if (!isOwner(lid, phoneNumber)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'ownerOnly'))
      });
      return;
    }

    if (!args[0] || !args[1]) {
      const blacklist = db.read('blacklist');
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `Nutze: .blacklist add/remove [nummer]\n\nAktuell auf der Blacklist:\n${blacklist.join('\n') || 'Niemand'}` :
          `Use: .blacklist add/remove [number]\n\nCurrently blacklisted:\n${blacklist.join('\n') || 'Nobody'}`)
      });
      return;
    }

    const action = args[0].toLowerCase();
    const number = args[1].replace(/[^0-9]/g, '');

    if (action === 'add') {
      db.addToBlacklist(number);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ ${number} zur Blacklist hinzugefügt!` :
          `✅ ${number} added to blacklist!`)
      });
    } else if (action === 'remove') {
      db.removeFromBlacklist(number);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ ${number} von der Blacklist entfernt!` :
          `✅ ${number} removed from blacklist!`)
      });
    }
  }
};
