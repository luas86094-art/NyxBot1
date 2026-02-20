import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'profile',
  registrationRequired: true,
  description: 'View your profile',
  
  async execute({ sock, chatId, lid, senderId, lang }) {
    const user = db.getUser(lid);
    const xpNeeded = user.level * 100;
    const xpProgress = Math.floor((user.xp / xpNeeded) * 100);
    
    const profileText = lang === 'de' ?
      `👤 *Profil von ${user.name}*\n\n` +
      `📊 Level: ${user.level}\n` +
      `⭐ XP: ${user.xp}/${xpNeeded} (${xpProgress}%)\n` +
      `💰 Geld: ${user.money}\n` +
      `🎂 Alter: ${user.age}\n` +
      `${user.teamRanks && user.teamRanks.length > 0 ? `👑 Ränge: ${user.teamRanks.join(', ')}\n` : ''}` +
      `📨 Nachrichten: ${user.stats.messages}\n` +
      `⚡ Befehle: ${user.stats.commands}`
      :
      `👤 *Profile of ${user.name}*\n\n` +
      `📊 Level: ${user.level}\n` +
      `⭐ XP: ${user.xp}/${xpNeeded} (${xpProgress}%)\n` +
      `💰 Money: ${user.money}\n` +
      `🎂 Age: ${user.age}\n` +
      `${user.teamRanks && user.teamRanks.length > 0 ? `👑 Ranks: ${user.teamRanks.join(', ')}\n` : ''}` +
      `📨 Messages: ${user.stats.messages}\n` +
      `⚡ Commands: ${user.stats.commands}`;
    
    await sock.sendMessage(chatId, {
      text: formatMessage(profileText),
      mentions: [senderId]
    });
  }
};
