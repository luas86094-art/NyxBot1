import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'slap',
  registrationRequired: false,
  description: 'Slap a user',
  
  async execute({ sock, chatId, mentions, args, message, lang }) {
    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .slap @user [optional text]' :
          '❌ Use: .slap @user [optional text]', 'slap', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderLid = senderId.split('@')[0];
    
    const customText = args.slice(1).join(' ');
    
    const text = customText ? 
      `👋💥 @${senderLid} slapped @${targetLid}!\n\n💬 "${customText}"` :
      `👋💥 @${senderLid} slapped @${targetLid}!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'slap', chatId),
      mentions: [senderId, targetJid]
    });
  }
};
