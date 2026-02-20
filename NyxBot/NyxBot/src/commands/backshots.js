import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'backshots',
  registrationRequired: false,
  description: 'give a user backshots',

  async execute({ sock, chatId, mentions, args, message, lang }) {
    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ?
          '❌ Nutze: .backshots @user [optional text]' :
          '❌ Use: .backshots @user [optional text]', 'backshots', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderLid = senderId.split('@')[0];

    const customText = args.slice(1).join(' ');

    const text = customText ?
      `👀❤️‍🔥 @${senderLid} gave @${targetLid} backshots ${customText}!🔥\n` +
`       ⣠⣶⣶⣦⡀ \n` +
`      ⢰⣿⣿⣿⣿            \n` +
`       ⠻⣿⣿⡿⠈      \n` +
`        ⣴⣶⣶⣄              \n` +
`        ⣿⣿⣿⣿⡄             \n` +
`        ⣿⣿⣿⣿⣿⣧\n` +
`        ⣿⣿⣿⡿⣿⣿⣆           ⣠⣴⣶⣤⡀ \n` +
`        ⣿⣿⣿⣿⠃⠈⢻⣿⣦     ⣿⣿⣿⣿⣿ \n` +
`        ⣿⣿⣿⡏⣴⣿⣷⣝⢿⣷⢀⠻⣿⣿⡿⠈ \n` +
`        ⢿⣿⣿⡇⢻⣿⣿⣿⣷⣶⣿⣿⣿⣿⣷    \n` +
`          ⢸⣿⣿⣇⢸⣿⣿⡟⠙⠛⠻⣿⣿⣿⣿⡇    /n` +
`⣴⣿⣿⣿⣿⣿⣿⣿⣠⣿⣿⡇         ⠉⠛⣽⣿⣇⣀⣀⣀ \n` +
`⠙⠻⠿⠿⠿⠿⠿⠟⠿⠿⠿⠇                 ⠻⠿⠿⠛⠛⠛` :
      `👀❤️‍🔥 @${senderLid} gave @${targetLid} backshots!🔥\n` +
`       ⣠⣶⣶⣦⡀ \n` +
`      ⢰⣿⣿⣿⣿            \n` +
`       ⠻⣿⣿⡿⠈      \n` +
`        ⣴⣶⣶⣄              \n` +
`        ⣿⣿⣿⣿⡄             \n` +
`        ⣿⣿⣿⣿⣿⣧\n` +
`        ⣿⣿⣿⡿⣿⣿⣆           ⣠⣴⣶⣤⡀ \n` +
`        ⣿⣿⣿⣿⠃⠈⢻⣿⣦     ⣿⣿⣿⣿⣿ \n` +
`        ⣿⣿⣿⡏⣴⣿⣷⣝⢿⣷⢀⠻⣿⣿⡿⠈ \n` +
`        ⢿⣿⣿⡇⢻⣿⣿⣿⣷⣶⣿⣿⣿⣿⣷    \n` +
`          ⢸⣿⣿⣇⢸⣿⣿⡟⠙⠛⠻⣿⣿⣿⣿⡇    /n` +
`⣴⣿⣿⣿⣿⣿⣿⣿⣠⣿⣿⡇         ⠉⠛⣽⣿⣇⣀⣀⣀ \n` +
`⠙⠻⠿⠿⠿⠿⠿⠟⠿⠿⠿⠇                 ⠻⠿⠿⠛⠛⠛`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'backshots', chatId),
      mentions: [senderId, targetJid]
    });
  }
};
