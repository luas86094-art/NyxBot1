import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'yearly',
  registrationRequired: true,
  description: 'Get yearly reward',
  
  async execute({ sock, chatId, lid, lang }) {
    const user = db.getUser(lid);
    const now = Date.now();
    const yearInMs = 365 * 24 * 60 * 60 * 1000;

    if (user.lastYearly && (now - user.lastYearly) < yearInMs) {
      const timeLeft = yearInMs - (now - user.lastYearly);
      const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⏰ Du hast deine jährliche Belohnung bereits abgeholt!\nKomm in ${daysLeft} Tagen wieder!` :
          `⏰ You already claimed your yearly reward!\nCome back in ${daysLeft} days!`)
      });
      return;
    }

    const reward = 50000 + (user.level * 1000);
    user.money += reward;
    user.lastYearly = now;
    db.updateUser(lid, user);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `🎁 Jährliche Belohnung!\n\nDu hast ${reward}💰 erhalten!\nKontostand: ${user.money}💰` :
        `🎁 Yearly Reward!\n\nYou received ${reward}💰!\nBalance: ${user.money}💰`)
    });
  }
};
