export default {
  name: 'listgroups',
  description: 'List all groups the bot participates in (JID and subject)',
  adminOnly: true,
  async execute({ sock, chatId }) {
    try {
      const groups = await sock.groupFetchAllParticipating();
      const groupJids = Object.keys(groups);

      if (!groupJids.length) {
        await sock.sendMessage(chatId, { text: 'Ich bin in keinen Gruppen.' });
        return;
      }

      const lines = groupJids.map(gid => {
        const subject = groups[gid]?.subject || '<kein Name>';
        return `• ${subject}\n  JID: ${gid}`;
      });

      const chunkSize = 40;
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join('\n\n');
        await sock.sendMessage(chatId, { text: `Gruppen (Teil ${Math.floor(i / chunkSize) + 1}):\n\n${chunk}` });
      }
    } catch (err) {
      console.error('listgroups error:', err);
      await sock.sendMessage(chatId, { text: 'Fehler beim Abrufen der Gruppen. Sieh die Konsole an.' });
    }
  }
};
