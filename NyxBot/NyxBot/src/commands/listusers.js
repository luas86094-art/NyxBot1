import { formatMessage, isOwner } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'listusers',
  aliases: ['userlist', 'users'],
  registrationRequired: true,
  description: 'List all registered users (owner only)',
  
  async execute({ sock, chatId, phoneNumber, lang }) {
    if (!isOwner(lid, phoneNumber)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'ownerOnly'))
      });
      return;
    }

    const usersRaw = db.read('users');
    const allUserLids = Object.keys(usersRaw);
    
    const allUsers = allUserLids.map(lid => db.getUser(lid));
    
    const registeredUsers = allUsers.filter(user => user.registered === true);
    const unregisteredUsers = allUsers.filter(user => user.registered === false);

    if (registeredUsers.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `📋 *User-Liste*\n\n❌ Keine registrierten User gefunden.` :
          `📋 *User List*\n\n❌ No registered users found.`)
      });
      return;
    }

    // Sort by level (descending)
    registeredUsers.sort((a, b) => b.level - a.level);

    let message = lang === 'de' ? 
      `👥 *REGISTRIERTE USER*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` :
      `👥 *REGISTERED USERS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    registeredUsers.forEach((user, index) => {
      const teamRanks = user.teamRanks || [];
      const ranksDisplay = teamRanks.length > 0 
        ? teamRanks.join(', ') 
        : (lang === 'de' ? 'Keine' : 'None');
      
      const vipStatus = user.vip ? '⭐' : '';
      
      message += lang === 'de' ?
        `${index + 1}. *${user.name}* ${vipStatus}\n` +
        `   📱 ID: ${user.lid}\n` +
        `   📊 Level: ${user.level} | XP: ${user.xp}\n` +
        `   💰 Geld: ${user.money}\n` +
        `   🏆 Ränge: ${ranksDisplay}\n` +
        `   📨 Nachrichten: ${user.stats?.messages || 0}\n` +
        `   ⚡ Befehle: ${user.stats?.commands || 0}\n\n` :
        `${index + 1}. *${user.name}* ${vipStatus}\n` +
        `   📱 ID: ${user.lid}\n` +
        `   📊 Level: ${user.level} | XP: ${user.xp}\n` +
        `   💰 Money: ${user.money}\n` +
        `   🏆 Ranks: ${ranksDisplay}\n` +
        `   📨 Messages: ${user.stats?.messages || 0}\n` +
        `   ⚡ Commands: ${user.stats?.commands || 0}\n\n`;
    });

    message += lang === 'de' ?
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 *Statistik*\n` +
      `✅ Registriert: ${registeredUsers.length}\n` +
      `❌ Nicht registriert: ${unregisteredUsers.length}\n` +
      `📈 Gesamt: ${allUsers.length}` :
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 *Statistics*\n` +
      `✅ Registered: ${registeredUsers.length}\n` +
      `❌ Unregistered: ${unregisteredUsers.length}\n` +
      `📈 Total: ${allUsers.length}`;

    await sock.sendMessage(chatId, {
      text: formatMessage(message)
    });
  }
};
