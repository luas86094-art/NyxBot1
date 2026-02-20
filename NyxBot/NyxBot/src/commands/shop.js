import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'shop',
  registrationRequired: true,
  description: 'View shop',
  
  async execute({ sock, chatId, lang }) {
    const shopData = db.read('shop');
    
    const petItems = shopData.items.filter(i => i.category === 'pet');
    const petPurchases = shopData.items.filter(i => i.category === 'pet_purchase');
    
    const shopText = lang === 'de' ?
      `🏪 *Shop*\n\n` +
      `🐾 *Haustiere kaufen:*\n` +
      petPurchases.map(item => `• ${item.name} - ${item.price}💰 (ID: ${item.id})`).join('\n') +
      `\n\n🍖 *Tierfutter:*\n` +
      petItems.map(item => `• ${item.name} - ${item.price}💰 (ID: ${item.id})`).join('\n') +
      `\n\n💡 Nutze .buy [id] um einen Artikel zu kaufen!`
      :
      `🏪 *Shop*\n\n` +
      `🐾 *Buy Pets:*\n` +
      petPurchases.map(item => `• ${item.name} - ${item.price}💰 (ID: ${item.id})`).join('\n') +
      `\n\n🍖 *Pet Food:*\n` +
      petItems.map(item => `• ${item.name} - ${item.price}💰 (ID: ${item.id})`).join('\n') +
      `\n\n💡 Use .buy [id] to purchase an item!`;
    
    await sock.sendMessage(chatId, {
      text: formatMessage(shopText)
    });
  }
};
