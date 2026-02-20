import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'pet',
  registrationRequired: true,
  description: 'View pet info',
  
  async execute({ sock, chatId, lid, lang }) {
    const pet = db.getPet(lid);

    if (!pet) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Du hast kein Haustier!\nKaufe eines im .shop!' :
          '❌ You don\'t have a pet!\nBuy one in .shop!')
      });
      return;
    }

    const petEmojis = {
      dog: '🐕',
      cat: '🐈',
      bird: '🐦',
      fish: '🐠'
    };

    const petText = lang === 'de' ?
      `🐾 *Haustier-Info*\n\n` +
      `${petEmojis[pet.type] || '🐾'} Name: ${pet.name}\n` +
      `📊 Level: ${pet.level}\n` +
      `⭐ XP: ${pet.xp}/100\n` +
      `🍖 Hunger: ${pet.hunger}/100\n` +
      `😊 Glück: ${pet.happiness}/100\n\n` +
      `💡 Nutze .feed um dein Haustier zu füttern!\n` +
      `💡 Nutze .pethunt um zu jagen!`
      :
      `🐾 *Pet Info*\n\n` +
      `${petEmojis[pet.type] || '🐾'} Name: ${pet.name}\n` +
      `📊 Level: ${pet.level}\n` +
      `⭐ XP: ${pet.xp}/100\n` +
      `🍖 Hunger: ${pet.hunger}/100\n` +
      `😊 Happiness: ${pet.happiness}/100\n\n` +
      `💡 Use .feed to feed your pet!\n` +
      `💡 Use .pethunt to go hunting!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(petText)
    });
  }
};
