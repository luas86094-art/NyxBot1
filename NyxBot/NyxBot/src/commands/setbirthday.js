import fs from 'fs';
import path from 'path';
import { formatMessage } from '../utils/helpers.js';
import { msg } from '../utils/languageHelper.js';

const DATA_DIR = path.resolve('./data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
  } catch (_) { /* silent */ }
}

function loadUsers() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (_) {
    return {};
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (_) { /* silent */ }
}

function getUserJid(message, chatId) {
  return message?.key?.participant || message?.key?.remoteJid || chatId;
}

function isValidDateDDMMYYYY(str) {
  // format tt.mm.jjjj
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(str);
  if (!m) return false;
  const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const maxDay = new Date(year, month, 0).getDate(); // day count of month
  if (day < 1 || day > maxDay) return false;
  return true;
}

export default {
  name: 'setbirthday',
  registrationRequired: true,
  description: 'Set registered birthday (tt.mm.jjjj)',

  async execute({ sock, chatId, message, args = [], lang }) {
    try {
      const userJid = getUserJid(message, chatId);

      if (!args || args.length === 0) {
        const usage = await msg(lang,
          '❌ Usage: .setbirthday dd.mm.yyyy',
          '❌ Nutzung: .setbirthday tt.mm.jjjj'
        );
        await sock.sendMessage(chatId, { text: formatMessage(usage, 'setbirthday', chatId) });
        return;
      }

      const dateStr = args.join(' ').trim();

      if (!isValidDateDDMMYYYY(dateStr)) {
        const invalid = await msg(lang,
          '❌ Invalid date format. Use dd.mm.yyyy (e.g. 31.12.1990).',
          '❌ Ungültiges Datumsformat. Verwende tt.mm.jjjj (z.B. 31.12.1990).'
        );
        await sock.sendMessage(chatId, { text: formatMessage(invalid, 'setbirthday', chatId) });
        return;
      }

      const users = loadUsers();

      if (!users[userJid]) {
        const notReg = await msg(lang,
          '❌ You are not registered.',
          '❌ Du bist nicht registriert.'
        );
        await sock.sendMessage(chatId, { text: formatMessage(notReg, 'setbirthday', chatId) });
        return;
      }

      users[userJid].birthday = dateStr;
      users[userJid].updatedAt = new Date().toISOString();
      saveUsers(users);

      const success = await msg(lang,
        `✅ Your birthday has been set to: ${dateStr}`,
        `✅ Dein Geburtstag wurde gesetzt auf: ${dateStr}`
      );
      await sock.sendMessage(chatId, { text: formatMessage(success, 'setbirthday', chatId) });
    } catch (_) {
      try {
        const err = await msg(lang,
          '❌ An internal error occurred.',
          '❌ Ein interner Fehler ist aufgetreten.'
        );
        await sock.sendMessage(chatId, { text: formatMessage(err, 'setbirthday', chatId) });
      } catch (_) { /* silent */ }
    }
  }
};
