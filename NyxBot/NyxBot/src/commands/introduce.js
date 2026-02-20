import { formatMessage } from '../utils/helpers.js';
import { msg } from '../utils/languageHelper.js';

export default {
  name: 'introduce',
  registrationRequired: false,
  description: 'Send a short bot introduction and quick guide',

  async execute({ sock, chatId, lang }) {
    try {
      const textEn = `Hi — I'm your chatbot 🤖

Quick guide:
• .menu — show all my commands
• .help — show important/helpful commands
• .support <text> — contact the team (for suggestions or questions)
• .reg <name.age> — register to use the bot features

Have fun! 🎉`;

      const textDe = `Hi — ich bin dein Chatbot 🤖

Kurzanleitung:
• .menu — zeigt alle meine Befehle
• .help — wichtige/kurze Hilfe
• .support <Text> — kontaktiere das Team (für Vorschläge oder Fragen)
• .reg <Name.Alter> — registriere dich, um den Bot zu nutzen

Viel Spaß! 🎉`;

      const intro = await msg(lang, textEn, textDe);
      await sock.sendMessage(chatId, { text: formatMessage(intro, 'introduce', chatId) });
    } catch (_) {
      try {
        const err = await msg(lang, '❌ An internal error occurred.', '❌ Ein interner Fehler ist aufgetreten.');
        await sock.sendMessage(chatId, { text: formatMessage(err, 'introduce', chatId) });
      } catch (_) { /* silent */ }
    }
  }
};
