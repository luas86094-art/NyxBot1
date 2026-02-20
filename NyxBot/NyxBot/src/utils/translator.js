import { translate } from '@vitalets/google-translate-api';

const languageCodes = {
  'de': 'de',
  'german': 'de',
  'deutsch': 'de',
  'en': 'en',
  'english': 'en',
  'englisch': 'en',
  'es': 'es',
  'spanish': 'es',
  'español': 'es',
  'spanisch': 'es',
  'fr': 'fr',
  'french': 'fr',
  'français': 'fr',
  'französisch': 'fr',
  'it': 'it',
  'italian': 'it',
  'italiano': 'it',
  'italienisch': 'it',
  'tr': 'tr',
  'turkish': 'tr',
  'türkçe': 'tr',
  'türkisch': 'tr',
  'ar': 'ar',
  'arabic': 'ar',
  'العربية': 'ar',
  'arabisch': 'ar',
  'ja': 'ja',
  'japanese': 'ja',
  '日本語': 'ja',
  'japanisch': 'ja',
  'kr': 'ko',
  'korean': 'ko',
  '한국어': 'ko',
  'koreanisch': 'ko',
  'ru': 'ru',
  'russian': 'ru',
  'русский': 'ru',
  'russisch': 'ru',
  'cs': 'cs',
  'czech': 'cs',
  'čeština': 'cs',
  'cestina': 'cs',
  'tschechisch': 'cs'
};

export async function translateText(text, targetLang, sourceLang = null) {
  try {
    const to = languageCodes[targetLang.toLowerCase()] || targetLang.toLowerCase();
    const from = sourceLang ? (languageCodes[sourceLang.toLowerCase()] || sourceLang.toLowerCase()) : null;
    
    const options = { to };
    if (from) options.from = from;
    
    const result = await translate(text, options);
    return {
      success: true,
      text: result.text,
      from: result.from?.language?.iso || 'auto',
      to: to
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error.message,
      text: text
    };
  }
}

export function getLanguageCode(langName) {
  return languageCodes[langName.toLowerCase()] || langName.toLowerCase();
}

export function isValidLanguage(langName) {
  const code = langName.toLowerCase();
  return code in languageCodes || code.length === 2;
}
