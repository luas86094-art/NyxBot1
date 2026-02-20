import { autoTranslate } from './autoTranslate.js';

export async function msg(lang, enText, deText = null) {
  if (lang === 'en') {
    return enText;
  }
  
  if (lang === 'de' && deText) {
    return deText;
  }
  
  if (lang === 'de' && !deText) {
    return await autoTranslate(enText, 'de');
  }
  
  return await autoTranslate(enText, lang);
}

export const LANG_NAMES = {
  'en': '🇬🇧 English',
  'de': '🇩🇪 Deutsch',
  'es': '🇪🇸 Español',
  'fr': '🇫🇷 Français',
  'it': '🇮🇹 Italiano',
  'tr': '🇹🇷 Türkçe',
  'ar': '🇸🇦 العربية',
  'ja': '🇯🇵 日本語',
  'kr': '🇰🇷 한국어',
  'ru': '🇷🇺 Русский',
  'cs': '🇨🇿 Čeština'
};

export const LANG_CODES = {
  'english': 'en',
  'german': 'de',
  'deutsch': 'de',
  'spanish': 'es',
  'español': 'es',
  'espanol': 'es',
  'french': 'fr',
  'français': 'fr',
  'francais': 'fr',
  'italian': 'it',
  'italiano': 'it',
  'turkish': 'tr',
  'türkçe': 'tr',
  'turkce': 'tr',
  'arabic': 'ar',
  'العربية': 'ar',
  'japanese': 'ja',
  '日本語': 'ja',
  'korean': 'kr',
  '한국어': 'kr',
  'russian': 'ru',
  'русский': 'ru',
  'czech': 'cs',
  'čeština': 'cs',
  'cestina': 'cs',
  'tschechisch': 'cs'
};

export function getLanguageCode(input) {
  const lower = input.toLowerCase().trim();
  
  if (LANG_NAMES[lower]) {
    return lower;
  }
  
  return LANG_CODES[lower] || null;
}
