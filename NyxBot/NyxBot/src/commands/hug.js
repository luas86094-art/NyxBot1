import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'hug',
  registrationRequired: false,
  description: 'Hug a user',
  
  async execute({ sock, chatId, mentions, args, message, lang }) {
    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .hug @user [optional text]' :
          '❌ Use: .hug @user [optional text]', 'hug', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderLid = senderId.split('@')[0];
    
    const customText = args.slice(1).join(' ');
    
    const text = customText ? 
      `🤗💕 @${senderLid} hugged @${targetLid} ${customText}!🫶🏻💖` :
      `🤗💕 @${senderLid} hugged @${targetLid}!🫶🏻💖`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'hug', chatId),
      mentions: [senderId, targetJid]
    });
  }
};
