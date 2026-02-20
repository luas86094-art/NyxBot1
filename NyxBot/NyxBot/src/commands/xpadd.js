import { formatMessage, isOwner } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'xpadd',
  registrationRequired: false,
  description: 'Add XP to a user (Owner only)',
  
  async execute({ sock, chatId, phoneNumber, mentions, args, lang }) {
    const owner = isOwner(lid, phoneNumber);

    if (!owner) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nur der Owner kann diesen Befehl nutzen!' :
          '❌ Only the Owner can use this command!', 'xpadd', chatId)
      });
      return;
    }

    if (!args[0] || !mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .xpadd [betrag] @user\n\nBeispiel:\n.xpadd 500 @user' :
          '❌ Use: .xpadd [amount] @user\n\nExample:\n.xpadd 500 @user', 'xpadd', chatId)
      });
      return;
    }

    const amount = parseInt(args[0]);
    
    if (isNaN(amount) || amount <= 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Ungültiger Betrag! Nutze eine positive Zahl.' :
          '❌ Invalid amount! Use a positive number.', 'xpadd', chatId)
      });
      return;
    }

    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];

    const targetUser = db.addXP(targetLid, amount);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Erfolgreich!\n\n⭐ +${amount} XP an @${targetLid} gegeben\n\n📊 Neues XP: ${targetUser.xp}⭐\n📊 Level: ${targetUser.level}` :
        `✅ Success!\n\n⭐ +${amount} XP given to @${targetLid}\n\n📊 New XP: ${targetUser.xp}⭐\n📊 Level: ${targetUser.level}`, 'xpadd', chatId),
      mentions: [targetJid]
    });
  }
};
