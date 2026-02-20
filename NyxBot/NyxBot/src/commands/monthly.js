import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'monthly',
  registrationRequired: true,
  description: 'Get monthly reward',
  
  async execute({ sock, chatId, lid, lang }) {
    const user = db.getUser(lid);
    const now = Date.now();
    const monthInMs = 30 * 24 * 60 * 60 * 1000;

    if (user.lastMonthly && (now - user.lastMonthly) < monthInMs) {
      const timeLeft = monthInMs - (now - user.lastMonthly);
      const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⏰ Du hast deine monatliche Belohnung bereits abgeholt!\nKomm in ${daysLeft} Tagen wieder!` :
          `⏰ You already claimed your monthly reward!\nCome back in ${daysLeft} days!`)
      });
      return;
    }

    const reward = 3000 + (user.level * 200);
    user.money += reward;
    user.lastMonthly = now;
    db.updateUser(lid, user);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `🎁 Monatliche Belohnung!\n\nDu hast ${reward}💰 erhalten!\nKontostand: ${user.money}💰` :
        `🎁 Monthly Reward!\n\nYou received ${reward}💰!\nBalance: ${user.money}💰`)
    });
  }
};
