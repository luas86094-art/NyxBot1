import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'level',
  registrationRequired: true,
  description: 'View your level',
  
  async execute({ sock, chatId, lid, senderId, lang }) {
    const user = db.getUser(lid);
    const xpNeeded = user.level * 100;
    const xpProgress = Math.floor((user.xp / xpNeeded) * 100);
    const progressBar = '█'.repeat(Math.floor(xpProgress / 10)) + '░'.repeat(10 - Math.floor(xpProgress / 10));
    
    const levelText = lang === 'de' ?
      `📊 *Level-Info*\n\n` +
      `Name: ${user.name}\n` +
      `Level: ${user.level}\n` +
      `XP: ${user.xp}/${xpNeeded}\n\n` +
      `[${progressBar}] ${xpProgress}%\n\n` +
      `💡 Tipp: Schreibe Nachrichten (+5 XP) oder nutze Befehle (+7 XP) um aufzusteigen!`
      :
      `📊 *Level Info*\n\n` +
      `Name: ${user.name}\n` +
      `Level: ${user.level}\n` +
      `XP: ${user.xp}/${xpNeeded}\n\n` +
      `[${progressBar}] ${xpProgress}%\n\n` +
      `💡 Tip: Send messages (+5 XP) or use commands (+7 XP) to level up!`;
    
    await sock.sendMessage(chatId, {
      text: formatMessage(levelText),
      mentions: [senderId]
    });
  }
};
