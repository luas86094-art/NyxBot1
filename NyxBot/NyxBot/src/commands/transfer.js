import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'transfer',
  registrationRequired: true,
  description: 'Transfer cash or XP to another user',
  
  async execute({ sock, chatId, lid, mentions, args, lang, message }) {
    if (!args[0] || !args[1] || !mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .transfer [cash/xp] [betrag] @user\n\nBeispiele:\n.transfer cash 500 @user\n.transfer xp 200 @user' :
          '❌ Use: .transfer [cash/xp] [amount] @user\n\nExamples:\n.transfer cash 500 @user\n.transfer xp 200 @user', 'transfer', chatId)
      });
      return;
    }

    const type = args[0].toLowerCase();
    
    if (type !== 'cash' && type !== 'xp') {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Ungültiger Typ! Nutze "cash" oder "xp".' :
          '❌ Invalid type! Use "cash" or "xp".', 'transfer', chatId)
      });
      return;
    }

    const amount = parseInt(args[1]);
    
    if (isNaN(amount) || amount <= 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Ungültiger Betrag! Nutze eine positive Zahl.' :
          '❌ Invalid amount! Use a positive number.', 'transfer', chatId)
      });
      return;
    }

    const senderUser = db.getUser(lid);
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderId = message.key.participant || message.key.remoteJid;

    if (targetLid === lid) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Du kannst dir nicht selbst etwas überweisen!' :
          '❌ You cannot transfer to yourself!', 'transfer', chatId)
      });
      return;
    }

    if (type === 'cash') {
      if (senderUser.cash < amount) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `❌ Nicht genug Cash!\n\n💰 Dein Cash: ${senderUser.cash}\n💰 Benötigt: ${amount}\n💰 Fehlt: ${amount - senderUser.cash}` :
            `❌ Not enough cash!\n\n💰 Your cash: ${senderUser.cash}\n💰 Required: ${amount}\n💰 Missing: ${amount - senderUser.cash}`, 'transfer', chatId)
        });
        return;
      }

      db.addUserCash(lid, -amount);
      db.addUserCash(targetLid, amount);
      
      const updatedSender = db.getUser(lid);
      const updatedTarget = db.getUser(targetLid);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Transfer erfolgreich!\n\n💰 ${amount} Cash übertragen\n\n👤 Von: @${lid}\n📊 Neuer Stand: ${updatedSender.cash}\n\n👤 An: @${targetLid}\n📊 Neuer Stand: ${updatedTarget.cash}` :
          `✅ Transfer successful!\n\n💰 ${amount} Cash transferred\n\n👤 From: @${lid}\n📊 New balance: ${updatedSender.cash}\n\n👤 To: @${targetLid}\n📊 New balance: ${updatedTarget.cash}`, 'transfer', chatId),
        mentions: [senderId, targetJid]
      });

    } else if (type === 'xp') {
      if (senderUser.xp < amount) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `❌ Nicht genug XP!\n\n💎 Dein XP: ${senderUser.xp}\n💎 Benötigt: ${amount}\n💎 Fehlt: ${amount - senderUser.xp}` :
            `❌ Not enough XP!\n\n💎 Your XP: ${senderUser.xp}\n💎 Required: ${amount}\n💎 Missing: ${amount - senderUser.xp}`, 'transfer', chatId)
        });
        return;
      }

      db.addUserXP(lid, -amount);
      db.addUserXP(targetLid, amount);
      
      const updatedSender = db.getUser(lid);
      const updatedTarget = db.getUser(targetLid);

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ Transfer erfolgreich!\n\n💎 ${amount} XP übertragen\n\n👤 Von: @${lid}\n📊 Neues XP: ${updatedSender.xp}\n📊 Level: ${updatedSender.level}\n\n👤 An: @${targetLid}\n📊 Neues XP: ${updatedTarget.xp}\n📊 Level: ${updatedTarget.level}` :
          `✅ Transfer successful!\n\n💎 ${amount} XP transferred\n\n👤 From: @${lid}\n📊 New XP: ${updatedSender.xp}\n📊 Level: ${updatedSender.level}\n\n👤 To: @${targetLid}\n📊 New XP: ${updatedTarget.xp}\n📊 Level: ${updatedTarget.level}`, 'transfer', chatId),
        mentions: [senderId, targetJid]
      });
    }
  }
};
