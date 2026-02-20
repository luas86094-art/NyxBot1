import { translateText } from './translator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '../../data/translationCache.json');

let translationCache = {};

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      translationCache = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading translation cache:', error);
    translationCache = {};
  }
}

function saveCache() {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(translationCache, null, 2));
  } catch (error) {
    console.error('Error saving translation cache:', error);
  }
}

loadCache();

const SUPPORTED_LANGUAGES = {
  'en': 'english',
  'de': 'german',
  'es': 'spanish',
  'fr': 'french',
  'it': 'italian',
  'tr': 'turkish',
  'ar': 'arabic',
  'ja': 'japanese',
  'kr': 'korean',
  'ru': 'russian',
  'cs': 'czech'
};

export async function autoTranslate(text, targetLang) {
  if (!text || !targetLang) return text;
  
  if (targetLang === 'en') return text;
  
  if (!SUPPORTED_LANGUAGES[targetLang]) {
    return text;
  }
  
  const cacheKey = `${text}|${targetLang}`;
  
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  
  try {
    const result = await translateText(text, targetLang);
    
    if (result.success) {
      translationCache[cacheKey] = result.text;
      saveCache();
      return result.text;
    }
  } catch (error) {
    console.error('Auto-translate error:', error);
  }
  
  return text;
}

export function t(lang, enText, deText = null) {
  if (lang === 'en') return enText;
  if (lang === 'de' && deText) return deText;
  
  return enText;
}

export async function translateIfNeeded(text, fromLang, toLang) {
  if (fromLang === toLang) return text;
  
  return await autoTranslate(text, toLang);
}
