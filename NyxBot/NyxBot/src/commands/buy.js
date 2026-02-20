import { formatMessage } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'buy',
  registrationRequired: true,
  description: 'Buy an item',
  
  async execute({ sock, chatId, lid, args, lang }) {
    if (!args[0]) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          'Nutze .buy [item-id]\nNutze .shop um verfügbare Items zu sehen!' :
          'Use .buy [item-id]\nUse .shop to see available items!')
      });
      return;
    }

    const itemId = args[0].toLowerCase();
    const shopData = db.read('shop');
    const item = shopData.items.find(i => i.id === itemId);

    if (!item) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          'Item nicht gefunden! Nutze .shop um verfügbare Items zu sehen!' :
          'Item not found! Use .shop to see available items!')
      });
      return;
    }

    const user = db.getUser(lid);

    if (user.money < item.price) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'notEnoughMoney'))
      });
      return;
    }

    if (item.category === 'pet_purchase') {
      const pet = db.getPet(lid);
      if (pet && pet.type === itemId) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            'Du hast bereits dieses Haustier!' :
            'You already have this pet!')
        });
        return;
      }

      db.updatePet(lid, {
        type: itemId,
        name: item.name,
        hunger: 100,
        happiness: 100,
        level: 1,
        xp: 0
      });
    } else {
      user.inventory.push(itemId);
    }

    user.money -= item.price;
    db.updateUser(lid, user);

    await sock.sendMessage(chatId, {
      text: formatMessage(
        `${translate(lang, 'purchaseSuccess')}\n` +
        (lang === 'de' ? 
          `Du hast ${item.name} für ${item.price}💰 gekauft!\nVerbleibend: ${user.money}💰` :
          `You purchased ${item.name} for ${item.price}💰!\nRemaining: ${user.money}💰`)
      )
    });
  }
};
