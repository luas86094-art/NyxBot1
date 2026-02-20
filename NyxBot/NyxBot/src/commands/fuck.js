import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'fuck',
  registrationRequired: false,
  description: 'Fuck a user',
  
  async execute({ sock, chatId, mentions, args, message, lang }) {
    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .fuck @user [optional text]' :
          '❌ Use: .fuck @user [optional text]', 'fuck', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderLid = senderId.split('@')[0];
    
    const customText = args.slice(1).join(' ');
    
    const text = customText ? 
      `🔥💦 @${senderLid} fucked @${targetLid}!\n\n💬 "${customText}"` :
      `🔥💦 @${senderLid} fucked @${targetLid}!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'fuck', chatId),
      mentions: [senderId, targetJid]
    });
  }
};
