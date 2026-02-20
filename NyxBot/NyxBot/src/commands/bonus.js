import { formatMessage, randomInt } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'bonus',
  registrationRequired: true,
  description: 'Get bonus reward (12h)',
  
  async execute({ sock, chatId, lid, lang }) {
    const user = db.getUser(lid);
    const now = Date.now();
    const bonusInterval = 12 * 60 * 60 * 1000;

    if (user.lastBonus && (now - user.lastBonus) < bonusInterval) {
      const timeLeft = bonusInterval - (now - user.lastBonus);
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⏰ Du hast deinen Bonus bereits abgeholt!\nKomm in ${hoursLeft}h ${minutesLeft}m wieder!` :
          `⏰ You already claimed your bonus!\nCome back in ${hoursLeft}h ${minutesLeft}m!`)
      });
      return;
    }

    const reward = randomInt(50, 200) + (user.level * 5);
    user.money += reward;
    user.lastBonus = now;
    db.updateUser(lid, user);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `🎁 Bonus Belohnung!\n\nDu hast ${reward}💰 erhalten!\nKontostand: ${user.money}💰` :
        `🎁 Bonus Reward!\n\nYou received ${reward}💰!\nBalance: ${user.money}💰`)
    });
  }
};
