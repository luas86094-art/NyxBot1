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

function isValidAge(ageStr) {
  const n = Number(ageStr);
  return Number.isInteger(n) && n > 0 && n < 200;
}

export default {
  name: 'changeage',
  registrationRequired: true,
  description: 'Change registered age',

  async execute({ sock, chatId, message, args = [], lang }) {
    try {
      const userJid = getUserJid(message, chatId);

      if (!args || args.length === 0) {
        const usage = await msg(lang,
          '❌ Usage: .changeage <age>',
          '❌ Nutzung: .changeage <Alter>'
        );
        await sock.sendMessage(chatId, { text: formatMessage(usage, 'changeage', chatId) });
        return;
      }

      const ageStr = args.join(' ').trim();
      if (!isValidAge(ageStr)) {
        const invalid = await msg(lang,
          '❌ Please provide a valid age (number between 1 and 199).',
          '❌ Bitte gib ein gültiges Alter an (Zahl zwischen 1 und 199).'
        );
        await sock.sendMessage(chatId, { text: formatMessage(invalid, 'changeage', chatId) });
        return;
      }

      const users = loadUsers();

      if (!users[userJid]) {
        const notReg = await msg(lang,
          '❌ You are not registered.',
          '❌ Du bist nicht registriert.'
        );
        await sock.sendMessage(chatId, { text: formatMessage(notReg, 'changeage', chatId) });
        return;
      }

      users[userJid].age = Number(ageStr);
      users[userJid].updatedAt = new Date().toISOString();
      saveUsers(users);

      const success = await msg(lang,
        `✅ Your age has been set to: ${users[userJid].age}`,
        `✅ Dein Alter wurde gesetzt auf: ${users[userJid].age}`
      );
      await sock.sendMessage(chatId, { text: formatMessage(success, 'changeage', chatId) });
    } catch (_) {
      try {
        const err = await msg(lang,
          '❌ An internal error occurred.',
          '❌ Ein interner Fehler ist aufgetreten.'
        );
        await sock.sendMessage(chatId, { text: formatMessage(err, 'changeage', chatId) });
      } catch (_) { /* silent */ }
    }
  }
};
