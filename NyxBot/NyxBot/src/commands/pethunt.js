import { formatMessage, randomInt } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'pethunt',
  registrationRequired: true,
  description: 'Go hunting with your pet',
  
  async execute({ sock, chatId, lid, lang }) {
    const pet = db.getPet(lid);
    const user = db.getUser(lid);

    if (!pet) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Du hast kein Haustier!' :
          '❌ You don\'t have a pet!')
      });
      return;
    }

    if (pet.hunger < 20) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Dein Haustier ist zu hungrig zum Jagen!\nFüttere es zuerst!' :
          '❌ Your pet is too hungry to hunt!\nFeed it first!')
      });
      return;
    }

    const reward = randomInt(10, 50) + (pet.level * 5);
    const xpGain = randomInt(10, 30);

    pet.hunger = Math.max(0, pet.hunger - 20);
    pet.xp += xpGain;
    
    if (pet.xp >= 100) {
      pet.level += 1;
      pet.xp = 0;
    }

    db.updatePet(lid, pet);
    
    user.money += reward;
    db.updateUser(lid, user);

    const huntText = lang === 'de' ?
      `🏹 *Jagd erfolgreich!*\n\n` +
      `Dein Haustier hat ${reward}💰 verdient!\n` +
      `+${xpGain} XP\n\n` +
      `${pet.xp >= 100 ? `🎉 Haustier ist jetzt Level ${pet.level}!\n\n` : ''}` +
      `Haustier Hunger: ${pet.hunger}/100\n` +
      `Dein Geld: ${user.money}💰`
      :
      `🏹 *Hunt successful!*\n\n` +
      `Your pet earned ${reward}💰!\n` +
      `+${xpGain} XP\n\n` +
      `${pet.xp >= 100 ? `🎉 Pet is now Level ${pet.level}!\n\n` : ''}` +
      `Pet Hunger: ${pet.hunger}/100\n` +
      `Your Money: ${user.money}💰`;

    await sock.sendMessage(chatId, {
      text: formatMessage(huntText)
    });
  }
};
