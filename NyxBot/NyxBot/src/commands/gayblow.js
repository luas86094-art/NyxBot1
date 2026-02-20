import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'gayblow',
  registrationRequired: false,
  description: 'give a user a gay blowjob',

  async execute({ sock, chatId, mentions, args, message, lang }) {
    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ?
          '❌ Nutze: .gayblow @user [optional text]' :
          '❌ Use: .gayblow @user [optional text]', 'gayblow', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const senderLid = senderId.split('@')[0];

    const customText = args.slice(1).join(' ');

    const text = customText ?
      `👀❤️‍🔥 @${senderLid} gave @${targetLid} a gay blowjob ${customText}!🔥\n` +
`   ⣴⣾⣿⣿⣶⡄             \n` +
`  ⢸⣿⣿⣿⣿⣿             \n` +
`  ⠈⢿⣿⣿⣿⠏             \n` +
`       ⠈⣉⣩⡀            \n` +
`     ⣼⣿⣿⣿⣷⡀            \n` +
`  ⣼⣿⣿⣿⣿⣿⡇            \n` +
` ⣾⣿⣿⣿⣿⣿⣿\n` +
`⣾⣿⣿⠉⣿⣿⣿⡇  ⢀⣠⣤⣤⣀     \n` +
` ⠙⣿⣿⣧⣿⣿⣿⢠⣿⣿⣿⣿⣿⣧    \n` +
`  ⠈⠻⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⡿   \n` +
`    ⠘⠿⢿⣿⣿⣿   ⠙⠻⠿⠿⠛⠁    \n` +
`       ⡟⣩⣝⢿  ⣠⣶⣶⣦⡀    \n` +
`       ⣷⡝⣿⣦⣠⣾⣿⣿⣿⣷⡀\n` +
`       ⣿⣿⣮⢻⣿⠟⣿⣿⣿⣿⣷⡀  \n` +
`       ⣿⣿⣿⡇       ⠻⣿⣿⣿⣿⣦\n` +
`      ⣿⣿⣿⡇           ⣿⣿⣿⣿⣿\n` +
`      ⣿⣿⣿⡇         ⣾⣿⣿⣿⣿\n` +
`      ⣿⣿⡿   ⢀⣴⣿⣿⣿⣿⣟⣋⣁⣀⣀ \n` +
`      ⠹⣿⠇   ⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇` :
      `👀❤️‍🔥 @${senderLid} gave @${targetLid} a gay blowjob!🔥\n` +
`   ⣴⣾⣿⣿⣶⡄             \n` +
`  ⢸⣿⣿⣿⣿⣿             \n` +
`  ⠈⢿⣿⣿⣿⠏             \n` +
`       ⠈⣉⣩⡀            \n` +
`     ⣼⣿⣿⣿⣷⡀            \n` +
`  ⣼⣿⣿⣿⣿⣿⡇            \n` +
` ⣾⣿⣿⣿⣿⣿⣿\n` +
`⣾⣿⣿⠉⣿⣿⣿⡇  ⢀⣠⣤⣤⣀     \n` +
` ⠙⣿⣿⣧⣿⣿⣿⢠⣿⣿⣿⣿⣿⣧    \n` +
`  ⠈⠻⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⡿   \n` +
`    ⠘⠿⢿⣿⣿⣿   ⠙⠻⠿⠿⠛⠁    \n` +
`       ⡟⣩⣝⢿  ⣠⣶⣶⣦⡀    \n` +
`       ⣷⡝⣿⣦⣠⣾⣿⣿⣿⣷⡀\n` +
`       ⣿⣿⣮⢻⣿⠟⣿⣿⣿⣿⣷⡀  \n` +
`       ⣿⣿⣿⡇       ⠻⣿⣿⣿⣿⣦\n` +
`      ⣿⣿⣿⡇           ⣿⣿⣿⣿⣿\n` +
`      ⣿⣿⣿⡇         ⣾⣿⣿⣿⣿\n` +
`      ⣿⣿⡿   ⢀⣴⣿⣿⣿⣿⣟⣋⣁⣀⣀ \n` +
`      ⠹⣿⠇   ⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'gayblow', chatId),
      mentions: [senderId, targetJid]
    });
  }
};
