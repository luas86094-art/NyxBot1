import { formatMessage, isOwner } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'setcommandtext',
  registrationRequired: true,
  description: 'Set custom response text for a command (Owner only)',
  
  async execute({ sock, chatId, phoneNumber, args, lang }) {
    if (!isOwner(lid, phoneNumber)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Dieser Befehl ist nur für den Owner verfügbar!' :
          '❌ This command is only available for the Owner!', null, chatId)
      });
      return;
    }

    if (args.length < 2) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `📝 *Command-Text Anpassung*\n\n` +
          `*Verwendung:*\n` +
          `• .setcommandtext [command] [text] - Text für Befehl setzen\n` +
          `• .setcommandtext [command] reset - Text zurücksetzen\n\n` +
          `*Beispiel:*\n` +
          `.setcommandtext ping Der Bot ist online!` :
          `📝 *Command Text Customization*\n\n` +
          `*Usage:*\n` +
          `• .setcommandtext [command] [text] - Set text for command\n` +
          `• .setcommandtext [command] reset - Reset text\n\n` +
          `*Example:*\n` +
          `.setcommandtext ping The bot is online!`, null, chatId)
      });
      return;
    }

    const commandName = args[0].toLowerCase().replace(/^\./, '');
    
    if (args[1] === 'reset') {
      db.removeCommandText(commandName);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Text für Befehl "${commandName}" wurde zurückgesetzt!` :
          `✅ Text for command "${commandName}" has been reset!`, null, chatId)
      });
      return;
    }

    const customText = args.slice(1).join(' ');
    db.setCommandText(commandName, customText);
    
    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Neuer Text für Befehl "${commandName}" gesetzt!\n\n*Text:*\n${customText}` :
        `✅ New text for command "${commandName}" set!\n\n*Text:*\n${customText}`, null, chatId)
    });
  }
};
