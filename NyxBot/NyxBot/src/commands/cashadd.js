import { formatMessage, isOwner } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'cashadd',
  registrationRequired: false,
  description: 'Add cash to a user (Owner only)',
  
  async execute({ sock, chatId, phoneNumber, mentions, args, lang }) {
    const owner = isOwner(lid, phoneNumber);

    if (!owner) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nur der Owner kann diesen Befehl nutzen!' :
          '❌ Only the Owner can use this command!', 'cashadd', chatId)
      });
      return;
    }

    if (!args[0] || !mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .cashadd [betrag] @user\n\nBeispiel:\n.cashadd 1000 @user' :
          '❌ Use: .cashadd [amount] @user\n\nExample:\n.cashadd 1000 @user', 'cashadd', chatId)
      });
      return;
    }

    const amount = parseInt(args[0]);
    
    if (isNaN(amount) || amount <= 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Ungültiger Betrag! Nutze eine positive Zahl.' :
          '❌ Invalid amount! Use a positive number.', 'cashadd', chatId)
      });
      return;
    }

    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];

    const targetUser = db.getUser(targetLid);
    targetUser.money += amount;
    db.updateUser(targetLid, targetUser);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Erfolgreich!\n\n💰 +${amount} Cash an @${targetLid} gegeben\n\n📊 Neuer Cash-Stand: ${targetUser.money}💰` :
        `✅ Success!\n\n💰 +${amount} Cash given to @${targetLid}\n\n📊 New cash balance: ${targetUser.money}💰`, 'cashadd', chatId),
      mentions: [targetJid]
    });
  }
};
