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

export default {
  name: 'changename',
  registrationRequired: true,
  description: 'Change registered display name',

  async execute({ sock, chatId, message, args = [], lang }) {
    try {
      const userJid = getUserJid(message, chatId);

      if (!args || args.length === 0) {
        const usage = await msg(lang,
          '❌ Usage: .changename <new name>',
          '❌ Nutzung: .changename <neuer Name>'
        );
        await sock.sendMessage(chatId, { text: formatMessage(usage, 'changename', chatId) });
        return;
      }

      const newName = args.join(' ').trim();
      if (!newName) {
        const empty = await msg(lang,
          '❌ Name cannot be empty.',
          '❌ Der Name darf nicht leer sein.'
        );
        await sock.sendMessage(chatId, { text: formatMessage(empty, 'changename', chatId) });
        return;
      }

      const users = loadUsers();

      if (!users[userJid]) {
        const notReg = await msg(lang,
          '❌ You are not registered.',
          '❌ Du bist nicht registriert.'
        );
        await sock.sendMessage(chatId, { text: formatMessage(notReg, 'changename', chatId) });
        return;
      }

      users[userJid].name = newName;
      users[userJid].updatedAt = new Date().toISOString();
      saveUsers(users);

      const success = await msg(lang,
        `✅ Your name has been changed to: ${newName}`,
        `✅ Dein Name wurde geändert in: ${newName}`
      );
      await sock.sendMessage(chatId, { text: formatMessage(success, 'changename', chatId) });
    } catch (_) {
      try {
        const err = await msg(lang,
          '❌ An internal error occurred.',
          '❌ Ein interner Fehler ist aufgetreten.'
        );
        await sock.sendMessage(chatId, { text: formatMessage(err, 'changename', chatId) });
      } catch (_) { /* silent */ }
    }
  }
};
