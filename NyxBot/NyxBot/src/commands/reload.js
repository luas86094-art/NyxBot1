import { formatMessage, isOwner } from '../utils/helpers.js';
import { msg } from '../utils/languageHelper.js';
import { connectBot, botState } from '../bot.js';

// Hilfsfunktion ggf. importieren, falls nicht global!
function normalizeJid(jid) {
  if (!jid) return jid;
  if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net')) return jid;
  const match = /^(\d+)@/.exec(jid);
  if (match) return `${match[1]}@s.whatsapp.net`;
  return jid;
}

export default {
  name: 'reload',
  registrationRequired: false,
  description: 'Reload bot connection (Owner only)',

  async execute({ sock, chatId, phoneNumber, lid, lang }) {
    const owner = isOwner(lid, phoneNumber);

    if (!owner) {
      const message = await msg(lang,
        '❌ Only the Owner can use this command!',
        '❌ Nur der Owner kann diesen Befehl nutzen!'
      );

      await sock.sendMessage(normalizeJid(chatId), {
        text: formatMessage(message, 'reload', chatId)
      });
      return;
    }

    try {
      const message = await msg(lang,
        '🔄 Reloading bot connection...\n\nThe bot will reconnect in a few seconds.',
        '🔄 Lade Bot-Verbindung neu...\n\nDer Bot verbindet sich in wenigen Sekunden neu.'
      );

      await sock.sendMessage(normalizeJid(chatId), {
        text: formatMessage(message, 'reload', chatId)
      });

      console.log('🔄 Bot reload initiated by Owner...');

      setTimeout(async () => {
        try {
          if (botState.sock) {
            await botState.sock.end();
          }

          await connectBot();

          const successMsg = await msg(lang,
            '✅ Bot reloaded successfully!',
            '✅ Bot erfolgreich neu geladen!'
          );

          // Neuer Sock existiert erst nach reconnect
          if (botState.sock) {
            await botState.sock.sendMessage(normalizeJid(chatId), {
              text: formatMessage(successMsg, 'reload', chatId)
            });
          }
        } catch (error) {
          console.error('Reload error:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Error in reload command:', error);

      const errorMsg = await msg(lang,
        '❌ Error reloading bot!',
        '❌ Fehler beim Neuladen des Bots!'
      );

      await sock.sendMessage(normalizeJid(chatId), {
        text: formatMessage(errorMsg, 'reload', chatId)
      });
    }
  }
};
