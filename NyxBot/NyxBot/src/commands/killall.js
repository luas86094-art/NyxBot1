import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'killall',
  registrationRequired: false,
  description: 'Kill everyone in the group',

  async execute({ sock, chatId, args, message, lang }) {
    const isGroup = chatId.endsWith('@g.us');

    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ?
          '❌ Dieser Befehl funktioniert nur in Gruppen!' :
          '❌ This command only works in groups!', 'killall', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const senderLid = senderId.split('@')[0];

    const customText = args.join(' ');

    const groupMeta = await sock.groupMetadata(chatId);
    const participants = groupMeta.participants.map(p => p.id);

    const text = customText ?
      `🔪🩸 @${senderLid} killed everyone!\n\n💬 "${customText}"` :
      `🔪🩸 @${senderLid} killed everyone!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'killall', chatId),
      mentions: participants
    });
  }
};
