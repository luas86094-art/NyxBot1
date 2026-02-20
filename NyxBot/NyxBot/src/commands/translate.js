import { formatMessage } from '../utils/helpers.js';
import { translateText } from '../utils/translator.js';
import { LANG_NAMES, getLanguageCode, msg } from '../utils/languageHelper.js';

const supportedLanguages = ['en', 'de', 'es', 'fr', 'it', 'tr', 'ar', 'ja', 'kr', 'ru', 'cs'];

export default {
  name: 'translate',
  registrationRequired: false,
  description: 'Translate quoted message to specified language',
  
  async execute({ sock, chatId, message, args, lang }) {
    if (!args[0] || args[0].toLowerCase() !== 'to' || !args[1]) {
      const langList = supportedLanguages.map(l => LANG_NAMES[l]).join('\n');
      const helpMessage = await msg(lang,
        `❌ Use: .translate to [language]\n\nQuote a message and use:\n.translate to german\n.translate to japanese\n.translate to russian\n\nSupported languages:\n${langList}`,
        `❌ Nutze: .translate to [sprache]\n\nMarkiere eine Nachricht und nutze dann:\n.translate to english\n.translate to japanese\n.translate to russian\n\nUnterstützte Sprachen:\n${langList}`
      );
      
      await sock.sendMessage(chatId, {
        text: formatMessage(helpMessage, 'translate', chatId)
      });
      return;
    }

    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMessage) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Bitte markiere eine Nachricht!' :
          '❌ Please quote a message!', 'translate', chatId)
      });
      return;
    }

    const textToTranslate = 
      quotedMessage.conversation ||
      quotedMessage.extendedTextMessage?.text ||
      quotedMessage.imageMessage?.caption ||
      quotedMessage.videoMessage?.caption ||
      '';

    if (!textToTranslate) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Die markierte Nachricht enthält keinen Text!' :
          '❌ The quoted message contains no text!', 'translate', chatId)
      });
      return;
    }

    const input = args.slice(1).join(' ').trim();
    const targetLang = getLanguageCode(input);

    if (!targetLang || !supportedLanguages.includes(targetLang)) {
      const langList = supportedLanguages.map(l => LANG_NAMES[l]).join(', ');
      const errorMessage = await msg(lang,
        `❌ Invalid language: ${input}\n\nAvailable: ${langList}`,
        `❌ Ungültige Sprache: ${input}\n\nVerfügbar: ${langList}`
      );
      
      await sock.sendMessage(chatId, {
        text: formatMessage(errorMessage, 'translate', chatId)
      });
      return;
    }

    const loadingMessage = await msg(lang, '🔄 Translating...', '🔄 Übersetze...');
    await sock.sendMessage(chatId, {
      text: formatMessage(loadingMessage, 'translate', chatId)
    });

    const result = await translateText(textToTranslate, targetLang);

    if (!result.success) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Übersetzungsfehler: ${result.error}` :
          `❌ Translation error: ${result.error}`, 'translate', chatId)
      });
      return;
    }

    const fromLangName = {
      'de': '🇩🇪 Deutsch',
      'en': '🇬🇧 English',
      'es': '🇪🇸 Español',
      'fr': '🇫🇷 Français',
      'it': '🇮🇹 Italiano',
      'tr': '🇹🇷 Türkçe',
      'ar': '🇸🇦 العربية'
    };

    const toLangName = {
      'de': '🇩🇪 Deutsch',
      'en': '🇬🇧 English',
      'es': '🇪🇸 Español',
      'fr': '🇫🇷 Français',
      'it': '🇮🇹 Italiano',
      'tr': '🇹🇷 Türkçe',
      'ar': '🇸🇦 العربية'
    };

    const responseText = lang === 'de' ?
      `🌍 *Übersetzung*\n\n` +
      `${fromLangName[result.from] || result.from.toUpperCase()} ➜ ${toLangName[result.to] || result.to.toUpperCase()}\n\n` +
      `📝 *Original:*\n${textToTranslate}\n\n` +
      `✅ *Übersetzt:*\n${result.text}`
      :
      `🌍 *Translation*\n\n` +
      `${fromLangName[result.from] || result.from.toUpperCase()} ➜ ${toLangName[result.to] || result.to.toUpperCase()}\n\n` +
      `📝 *Original:*\n${textToTranslate}\n\n` +
      `✅ *Translated:*\n${result.text}`;

    await sock.sendMessage(chatId, {
      text: formatMessage(responseText, 'translate', chatId)
    });
  }
};
