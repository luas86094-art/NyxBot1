import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'pat',
  registrationRequired: false,
  description: 'pat a user',

  async execute({ sock, chatId, mentions, args, message, lang }) {
    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ?
          '❌ Nutze: .pat @user [optional text]' :
          '❌ Use: .pat @user [optional text]', 'pat', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderLid = senderId.split('@')[0];

    const customText = args.slice(1).join(' ');

    const text = customText ?
      `🥰🫶🏻 @${senderLid} patted @${targetLid}!\n\n💬 "${customText}"` :
      `🥰🫶🏻 @${senderLid} patted @${targetLid}!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'pat', chatId),
      mentions: [senderId, targetJid]
    });
  }
};
