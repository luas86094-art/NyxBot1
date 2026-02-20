import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'daily',
  registrationRequired: true,
  description: 'Get daily reward',
  
  async execute({ sock, chatId, lid, lang }) {
    const user = db.getUser(lid);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (user.lastDaily && (now - user.lastDaily) < dayInMs) {
      const timeLeft = dayInMs - (now - user.lastDaily);
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⏰ Du hast deine tägliche Belohnung bereits abgeholt!\nKomm in ${hoursLeft}h ${minutesLeft}m wieder!` :
          `⏰ You already claimed your daily reward!\nCome back in ${hoursLeft}h ${minutesLeft}m!`)
      });
      return;
    }

    const reward = 100 + (user.level * 10);
    user.money += reward;
    user.lastDaily = now;
    db.updateUser(lid, user);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `🎁 Tägliche Belohnung!\n\nDu hast ${reward}💰 erhalten!\nKontostand: ${user.money}💰` :
        `🎁 Daily Reward!\n\nYou received ${reward}💰!\nBalance: ${user.money}💰`)
    });
  }
};
