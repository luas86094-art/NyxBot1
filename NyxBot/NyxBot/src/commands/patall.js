import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'patall',
  registrationRequired: false,
  description: 'Pat everyone in the group',

  async execute({ sock, chatId, args, message, lang }) {
    const isGroup = chatId.endsWith('@g.us');

    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ?
          '❌ Dieser Befehl funktioniert nur in Gruppen!' :
          '❌ This command only works in groups!', 'patall', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const senderLid = senderId.split('@')[0];

    const customText = args.join(' ');

    const groupMeta = await sock.groupMetadata(chatId);
    const participants = groupMeta.participants.map(p => p.id);

    const text = customText ?
      `🥰🫶🏻 @${senderLid} patted everyone!\n\n💬 "${customText}"` :
      `🥰🫶🏻 @${senderLid} patted everyone!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'patall', chatId),
      mentions: participants
    });
  }
};
