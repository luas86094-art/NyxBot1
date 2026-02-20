import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'kiss',
  registrationRequired: false,
  description: 'Kiss a user',
  
  async execute({ sock, chatId, mentions, args, message, lang }) {
    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .kiss @user [optional text]' :
          '❌ Use: .kiss @user [optional text]', 'kiss', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderLid = senderId.split('@')[0];
    
    const customText = args.slice(1).join(' ');
    
    const text = customText ? 
      `😘💋 @${senderLid} kissed @${targetLid}!\n\n💬 "${customText}"` :
      `😘💋 @${senderLid} kissed @${targetLid}!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'kiss', chatId),
      mentions: [senderId, targetJid]
    });
  }
};
