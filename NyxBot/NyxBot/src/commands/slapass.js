import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'slapass',
  registrationRequired: false,
  description: 'Slap someone\'s ass',
  
  async execute({ sock, chatId, mentions, args, message, lang }) {
    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .slapass @user [optional text]' :
          '❌ Use: .slapass @user [optional text]', 'slapass', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderLid = senderId.split('@')[0];
    
    const customText = args.slice(1).join(' ');
    
    const text = customText ? 
      `🍑👋 @${senderLid} slapped @${targetLid}'s ass!\n\n💬 "${customText}"` :
      `🍑👋 @${senderLid} slapped @${targetLid}'s ass!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'slapass', chatId),
      mentions: [senderId, targetJid]
    });
  }
};
