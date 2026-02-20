import { formatMessage, isOwner, isDesigner } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'setmessagedesign',
  registrationRequired: true,
  description: 'Set message design globally or for specific command (Owner/Designer only)',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, args, lang }) {
    const owner = isOwner(lid, phoneNumber);
    const designer = isDesigner(lid);

    if (!owner && !designer) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Dieser Befehl ist nur für Owner und Designer verfügbar!' :
          '❌ This command is only available for Owner and Designer!', null, chatId)
      });
      return;
    }

    if (args.length === 0) {
      const currentDesign = db.getMessageDesign();
      const designInfo = lang === 'de' ?
        `📝 *Aktuelles globales Design:*\n\n` +
        `Header: ${currentDesign.header || '(leer)'}\n` +
        `Footer: ${currentDesign.footer || '(leer)'}\n` +
        `Template: ${currentDesign.template ? '✅ Aktiv' : '❌ Nicht aktiv'}\n\n` +
        `*Verwendung:*\n` +
        `• .setmessagedesign header [text] - Header setzen\n` +
        `• .setmessagedesign footer [text] - Footer setzen\n` +
        `• .setmessagedesign template [text] - Template mit {text} Platzhalter\n` +
        `• .setmessagedesign [command] header [text] - Command-Header\n` +
        `• .setmessagedesign [command] footer [text] - Command-Footer\n` +
        `• .setmessagedesign [command] template [text] - Command-Template\n` +
        `• .setmessagedesign reset - Auf Standard zurücksetzen\n\n` +
        `*Beispiele:*\n` +
        `• .setmessagedesign header ╔═══════╗\n` +
        `• .setmessagedesign footer Made with ❤️\n` +
        `• .setmessagedesign template ✨ {text} ✨\n` +
        `• .setmessagedesign ping footer 🏓 Pong Bot` :
        `📝 *Current global design:*\n\n` +
        `Header: ${currentDesign.header || '(empty)'}\n` +
        `Footer: ${currentDesign.footer || '(empty)'}\n` +
        `Template: ${currentDesign.template ? '✅ Active' : '❌ Not active'}\n\n` +
        `*Usage:*\n` +
        `• .setmessagedesign header [text] - Set header\n` +
        `• .setmessagedesign footer [text] - Set footer\n` +
        `• .setmessagedesign template [text] - Template with {text} placeholder\n` +
        `• .setmessagedesign [command] header [text] - Command header\n` +
        `• .setmessagedesign [command] footer [text] - Command footer\n` +
        `• .setmessagedesign [command] template [text] - Command template\n` +
        `• .setmessagedesign reset - Reset to default\n\n` +
        `*Examples:*\n` +
        `• .setmessagedesign header ╔═══════╗\n` +
        `• .setmessagedesign footer Made with ❤️\n` +
        `• .setmessagedesign template ✨ {text} ✨\n` +
        `• .setmessagedesign ping footer 🏓 Pong Bot`;

      await sock.sendMessage(chatId, {
        text: formatMessage(designInfo, null, chatId)
      });
      return;
    }

    if (args[0] === 'reset') {
      db.resetMessageDesign();
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ Globales Design wurde auf Standard zurückgesetzt!' :
          '✅ Global design has been reset to default!', null, chatId)
      });
      return;
    }

    if (args[0] === 'header' || args[0] === 'footer' || args[0] === 'template') {
      const type = args[0];
      const text = args.slice(1).join(' ');
      
      if (!text) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `❌ Bitte gib einen Text für ${type} an!` :
            `❌ Please provide text for ${type}!`, null, chatId)
        });
        return;
      }
      
      if (type === 'template' && !text.includes('{text}')) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `❌ Template muss den Platzhalter {text} enthalten!\n\nBeispiel: ╔═══╗\n{text}\n╚═══╝` :
            `❌ Template must contain the placeholder {text}!\n\nExample: ╔═══╗\n{text}\n╚═══╝`, null, chatId)
        });
        return;
      }
      
      db.setMessageDesign(type, text);
      
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Globaler ${type} gesetzt!\n\n${type === 'template' ? 'Template:\n' : ''}${text}` :
          `✅ Global ${type} set!\n\n${type === 'template' ? 'Template:\n' : ''}${text}`, null, chatId)
      });
      return;
    }

    const commandName = args[0].toLowerCase().replace(/^\./, '');
    
    if (args[1] === 'reset') {
      db.removeCommandDesign(commandName, chatId);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Design für Befehl "${commandName}" wurde zurückgesetzt!` :
          `✅ Design for command "${commandName}" has been reset!`, null, chatId)
      });
      return;
    }

    if (args[1] === 'header' || args[1] === 'footer' || args[1] === 'template') {
      const type = args[1];
      const text = args.slice(2).join(' ');
      
      if (!text) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `❌ Bitte gib einen Text für ${type} an!` :
            `❌ Please provide text for ${type}!`, null, chatId)
        });
        return;
      }
      
      if (type === 'template' && !text.includes('{text}')) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `❌ Template muss den Platzhalter {text} enthalten!\n\nBeispiel: ╔═══╗\n{text}\n╚═══╝` :
            `❌ Template must contain the placeholder {text}!\n\nExample: ╔═══╗\n{text}\n╚═══╝`, null, chatId)
        });
        return;
      }
      
      db.setCommandDesign(commandName, type, text, chatId);
      
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ ${type} für Befehl "${commandName}" gesetzt!\n\n${text}` :
          `✅ ${type} for command "${commandName}" set!\n\n${text}`, null, chatId)
      });
      return;
    }

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `❌ Ungültige Verwendung! Nutze:\n` +
        `.setmessagedesign header/footer/template [text]\n` +
        `.setmessagedesign [command] header/footer/template [text]` :
        `❌ Invalid usage! Use:\n` +
        `.setmessagedesign header/footer/template [text]\n` +
        `.setmessagedesign [command] header/footer/template [text]`, null, chatId)
    });
  }
};
