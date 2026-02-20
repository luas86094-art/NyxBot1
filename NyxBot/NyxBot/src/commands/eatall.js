import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'eatall',
  registrationRequired: false,
  description: 'Eat everyone in the group',

  async execute({ sock, chatId, args, message, lang }) {
    const isGroup = chatId.endsWith('@g.us');

    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ?
          '❌ Dieser Befehl funktioniert nur in Gruppen!' :
          '❌ This command only works in groups!', 'eatall', chatId)
      });
      return;
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const senderLid = senderId.split('@')[0];

    const customText = args.join(' ');

    const groupMeta = await sock.groupMetadata(chatId);
    const participants = groupMeta.participants.map(p => p.id);

    const text = customText ?
      `‼️Kannibale‼️\n🔪🩸 @${senderLid} ate everyone!\n\n💬 "${customText}"` :
      `‼️Cannibalism‼️\n🔪🩸 @${senderLid} ate everyone!`;

    await sock.sendMessage(chatId, {
      text: formatMessage(text, 'eatall', chatId),
      mentions: participants
    });
  }
};
