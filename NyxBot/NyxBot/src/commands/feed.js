import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'feed',
  registrationRequired: true,
  description: 'Feed your pet',
  
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

    const foodMap = {
      dog: 'dog_food',
      cat: 'cat_food',
      bird: 'bird_food',
      fish: 'fish_food'
    };

    const requiredFood = foodMap[pet.type];
    const hasFood = user.inventory.includes(requiredFood);

    if (!hasFood) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Du hast kein Futter für dein Haustier!\nKaufe ${requiredFood} im .shop!` :
          `❌ You don't have food for your pet!\nBuy ${requiredFood} in .shop!`)
      });
      return;
    }

    const foodIndex = user.inventory.indexOf(requiredFood);
    user.inventory.splice(foodIndex, 1);
    db.updateUser(lid, user);

    pet.hunger = Math.min(100, pet.hunger + 30);
    pet.happiness = Math.min(100, pet.happiness + 10);
    db.updatePet(lid, pet);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `🍖 Du hast dein Haustier gefüttert!\n\n` +
        `Hunger: ${pet.hunger}/100\n` +
        `Glück: ${pet.happiness}/100` :
        `🍖 You fed your pet!\n\n` +
        `Hunger: ${pet.hunger}/100\n` +
        `Happiness: ${pet.happiness}/100`)
    });
  }
};
