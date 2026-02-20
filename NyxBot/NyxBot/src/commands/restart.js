import { formatMessage, isOwner } from '../utils/helpers.js';
import { msg } from '../utils/languageHelper.js';

// Hilfsfunktion ggf. importieren, falls nicht global!
function normalizeJid(jid) {
  if (!jid) return jid;
  if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net')) return jid;
  const match = /^(\d+)@/.exec(jid);
  if (match) return `${match[1]}@s.whatsapp.net`;
  return jid;
}

export default {
  name: 'restart',
  registrationRequired: false,
  description: 'Restart bot process (Owner only)',

  async execute({ sock, chatId, phoneNumber, lid, lang }) {
    const owner = isOwner(lid, phoneNumber);

    if (!owner) {
      const message = await msg(lang,
        '❌ Only the Owner can use this command!',
        '❌ Nur der Owner kann diesen Befehl nutzen!'
      );

      await sock.sendMessage(normalizeJid(chatId), {
        text: formatMessage(message, 'restart', chatId)
      });
      return;
    }

    try {
      const message = await msg(lang,
        '🔄 Restarting bot...\n\nThe bot will be back online in ~10 seconds.\n\n💾 All data has been saved.\n🔐 Session will be preserved.',
        '🔄 Starte Bot neu...\n\nDer Bot ist in ~10 Sekunden wieder online.\n\n💾 Alle Daten wurden gespeichert.\n🔐 Session bleibt erhalten.'
      );

      await sock.sendMessage(normalizeJid(chatId), {
        text: formatMessage(message, 'restart', chatId)
      });

      console.log('🔄 Bot restart initiated by Owner...');
      console.log('💾 All data is saved in JSON files');
      console.log('🔐 WhatsApp session will be preserved');

      setTimeout(() => {
        console.log('🔄 Restarting bot process now...');
        process.exit(0);
      }, 3000);

    } catch (error) {
      console.error('Error in restart command:', error);

      const errorMsg = await msg(lang,
        '❌ Error restarting bot!',
        '❌ Fehler beim Neustart des Bots!'
      );

      await sock.sendMessage(normalizeJid(chatId), {
        text: formatMessage(errorMsg, 'restart', chatId)
      });
    }
  }
};
