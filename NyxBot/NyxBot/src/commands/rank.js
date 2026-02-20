import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'rank',
  aliases: ['leaderboard', 'top'],
  registrationRequired: true,
  description: 'Show leaderboard',
  
  async execute({ sock, chatId, lang }) {
    const users = db.read('users');
    const sortedUsers = Object.values(users)
      .filter(u => u.registered)
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.xp - a.xp;
      })
      .slice(0, 10);

    if (sortedUsers.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Keine registrierten Nutzer!' :
          '❌ No registered users!')
      });
      return;
    }

    const leaderboard = sortedUsers
      .map((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `${medal} ${user.name} - Level ${user.level} (${user.xp} XP)`;
      })
      .join('\n');

    const text = lang === 'de' ?
      `🏆 *Rangliste*\n\n${leaderboard}` :
      `🏆 *Leaderboard*\n\n${leaderboard}`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text)
    });
  }
};
