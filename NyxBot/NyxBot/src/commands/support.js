import fs from 'fs';
import path from 'path';
import { formatMessage } from '../utils/helpers.js';
import { msg } from '../utils/languageHelper.js';

const DATA_DIR = path.resolve('./data');
const SUPPORT_FILE = path.join(DATA_DIR, 'support.json');

// IDs ANPASSEN!
const PRIVATE_SUPPORT_GROUP = '120363405424563641@g.us'; // INTERN (Team)
const PUBLIC_SUPPORT_GROUP  = '120363405211482343@g.us'; // ÖFFENTLICH (User)

// Ensure data dir / file exist (silent)
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SUPPORT_FILE)) fs.writeFileSync(SUPPORT_FILE, JSON.stringify([], null, 2));
} catch (_) { /* silent */ }

function loadTickets() {
  try {
    const raw = fs.readFileSync(SUPPORT_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (_) {
    return [];
  }
}

function saveTickets(data) {
  try {
    fs.writeFileSync(SUPPORT_FILE, JSON.stringify(data, null, 2));
  } catch (_) { /* silent */ }
}

export default {
  name: 'support',
  registrationRequired: true,
  description: 'Support-System',

  async execute({ sock, chatId, message, args = [], lang }) {
    try {
      const from = message?.key?.remoteJid || chatId;
      const sender = message?.key?.participant || from;
      const text = Array.isArray(args) ? args.join(' ').trim() : (args || '').trim();

      // Usage
      if (!text) {
        const usage = await msg(lang,
          '❓ Usage:\n.support <your issue>',
          '❓ Nutzung:\n.support <dein Problem>'
        );

        await sock.sendMessage(from, {
          text: formatMessage(usage, 'support', from)
        });
        return;
      }

      const tickets = loadTickets();
      const ticketId = Date.now().toString();

      const ticket = {
        id: ticketId,
        user: sender,
        chat: from,
        text,
        open: true,
        createdAt: new Date().toISOString()
      };

      tickets.push(ticket);
      saveTickets(tickets);

      // Notify private/internal support group (mention the user)
      try {
        const internMsg = await msg(lang,
`🆘 *NEW SUPPORT REQUEST*

🆔 Ticket: ${ticketId}
👤 User: ${sender}
💬 Message:
${text}

✏️ Reply with:
.supportreply ${ticketId} <answer>`,
`🆘 *NEUE SUPPORT-ANFRAGE*

🆔 Ticket: ${ticketId}
👤 User: ${sender}
💬 Nachricht:
${text}

✏️ Antworten mit:
.supportreply ${ticketId} <Antwort>`);
        await sock.sendMessage(PRIVATE_SUPPORT_GROUP, {
          text: formatMessage(internMsg, 'support', PRIVATE_SUPPORT_GROUP),
          mentions: [sender]
        });
      } catch (_) {
        const failMsg = await msg(lang,
          '⚠️ Your request could not be forwarded to the support team. Please try again later.',
          '⚠️ Deine Anfrage konnte nicht an das Support-Team weitergeleitet werden. Bitte versuche es später erneut.'
        );
        await sock.sendMessage(from, { text: formatMessage(failMsg, 'support', from) });
        return;
      }

      // Confirm to user
      const confirmMsg = await msg(lang,
`✅ *Support request sent!*

🆔 Ticket-ID: ${ticketId}
📩 Our team will get back to you soon.`,
`✅ *Support-Anfrage gesendet!*

🆔 Ticket-ID: ${ticketId}
📩 Unser Team meldet sich bald.`);
      await sock.sendMessage(from, {
        text: formatMessage(confirmMsg, 'support', from)
      });

      // Optionally also post a short public notice (if PUBLIC_SUPPORT_GROUP set)
      if (PUBLIC_SUPPORT_GROUP) {
        try {
          const publicMsg = await msg(lang,
`🆘 *New support request received (public notice)*

🆔 Ticket: ${ticketId}
👤 User: ${sender}
💬 ${text}`,
`🆘 *Neue Support-Anfrage (öffentliche Mitteilung)*

🆔 Ticket: ${ticketId}
👤 User: ${sender}
💬 ${text}`);
          await sock.sendMessage(PUBLIC_SUPPORT_GROUP, {
            text: formatMessage(publicMsg, 'support', PUBLIC_SUPPORT_GROUP)
          });
        } catch (_) { /* silent */ }
      }
    } catch (_) {
      try {
        const errMsg = await msg(lang,
          '❌ An internal error occurred.',
          '❌ Ein interner Fehler ist aufgetreten.'
        );
        await sock.sendMessage(message?.key?.remoteJid || chatId, { text: formatMessage(errMsg, 'support', chatId) });
      } catch (_) { /* silent */ }
    }
  }
};
