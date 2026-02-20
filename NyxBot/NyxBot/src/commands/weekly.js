import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'weekly',
  registrationRequired: true,
  description: 'Get weekly reward',
  
  async execute({ sock, chatId, lid, lang }) {
    const user = db.getUser(lid);
    const now = Date.now();
    const weekInMs = 7 * 24 * 60 * 60 * 1000;

    if (user.lastWeekly && (now - user.lastWeekly) < weekInMs) {
      const timeLeft = weekInMs - (now - user.lastWeekly);
      const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
      const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⏰ Du hast deine wöchentliche Belohnung bereits abgeholt!\nKomm in ${daysLeft}d ${hoursLeft}h wieder!` :
          `⏰ You already claimed your weekly reward!\nCome back in ${daysLeft}d ${hoursLeft}h!`)
      });
      return;
    }

    const reward = 750 + (user.level * 50);
    user.money += reward;
    user.lastWeekly = now;
    db.updateUser(lid, user);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `🎁 Wöchentliche Belohnung!\n\nDu hast ${reward}💰 erhalten!\nKontostand: ${user.money}💰` :
        `🎁 Weekly Reward!\n\nYou received ${reward}💰!\nBalance: ${user.money}💰`)
    });
  }
};
