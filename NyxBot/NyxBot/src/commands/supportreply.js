import fs from 'fs';
import path from 'path';
import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { msg } from '../utils/languageHelper.js';

const SUPPORT_FILE = path.join(path.resolve('./data'), 'support.json');
const PUBLIC_SUPPORT_GROUP = '120363405211482343@g.us';

// Safe load/save (silent)
function loadTickets() {
  try {
    if (!fs.existsSync(SUPPORT_FILE)) return [];
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
  name: 'supportreply',
  registrationRequired: true,
  description: 'Antwort auf Support-Ticket',

  async execute({ sock, chatId, message, args = [], lang, phoneNumber }) {
    try {
      const from = message?.key?.remoteJid || chatId;
      const senderId = message?.key?.participant || from;

      // Permission: only team / owner can reply
      const allowed = isOwner(lid, phoneNumber) || hasTeamRank(lid, 'Supporter') || hasTeamRank(lid, 'Owner');
      if (!allowed) {
        const noPerm = await msg(lang,
          '❌ You are not allowed to answer support requests.',
          '❌ Du hast keine Berechtigung, Supportanfragen zu beantworten.'
        );
        await sock.sendMessage(from, { text: formatMessage(noPerm, 'supportreply', from) });
        return;
      }

      const ticketId = Array.isArray(args) && args.length > 0 ? String(args[0]).trim() : '';
      const reply = Array.isArray(args) ? args.slice(1).join(' ').trim() : '';

      if (!ticketId || !reply) {
        const usage = await msg(lang,
          '❌ Usage: .supportreply <TicketID> <answer>',
          '❌ Nutzung: .supportreply <TicketID> <Antwort>'
        );
        await sock.sendMessage(from, { text: formatMessage(usage, 'supportreply', from) });
        return;
      }

      const tickets = loadTickets();
      const idx = tickets.findIndex(t => t.id === ticketId && t.open);
      if (idx === -1) {
        const notFound = await msg(lang,
          '❌ Ticket not found or already closed.',
          '❌ Ticket nicht gefunden oder bereits geschlossen.'
        );
        await sock.sendMessage(from, { text: formatMessage(notFound, 'supportreply', from) });
        return;
      }

      const ticket = tickets[idx];
      ticket.open = false;
      ticket.answeredAt = new Date().toISOString();
      ticket.answer = reply;
      ticket.answeredBy = senderId;
      tickets[idx] = ticket;
      saveTickets(tickets);

      // Send reply to user (include original user text)
      try {
        const userMsg = await msg(lang,
`📩 *Support Answer*

🆔 Ticket: ${ticketId}

📝 Original request:
${ticket.text}

💬 Answer:
${reply}`,
`📩 *Support-Antwort*

🆔 Ticket: ${ticketId}

📝 Ursprüngliche Anfrage:
${ticket.text}

💬 Antwort:
${reply}`);
        await sock.sendMessage(ticket.chat, {
          text: formatMessage(userMsg, 'supportreply', ticket.chat),
          mentions: [senderId]
        });
      } catch (_) {
        const failUser = await msg(lang,
          '⚠️ Failed to send the answer to the user.',
          '⚠️ Fehler beim Senden der Antwort an den User.'
        );
        await sock.sendMessage(from, { text: formatMessage(failUser, 'supportreply', from) });
      }

      // Post to public support group (include original user text)
      try {
        const publicMsg = await msg(lang,
`✅ *Support completed*

🆔 Ticket: ${ticketId}
👤 User: ${ticket.user || ticket.chat}
📝 Original request:
${ticket.text}

💬 Answer:
${reply}`,
`✅ *Support abgeschlossen*

🆔 Ticket: ${ticketId}
👤 User: ${ticket.user || ticket.chat}
📝 Ursprüngliche Anfrage:
${ticket.text}

💬 Antwort:
${reply}`);
        await sock.sendMessage(PUBLIC_SUPPORT_GROUP, {
          text: formatMessage(publicMsg, 'supportreply', PUBLIC_SUPPORT_GROUP)
        });
      } catch (_) {
        const failPublic = await msg(lang,
          '⚠️ Failed to post in the public support group.',
          '⚠️ Fehler beim Posten in die öffentliche Support-Gruppe.'
        );
        await sock.sendMessage(from, { text: formatMessage(failPublic, 'supportreply', from) });
      }

    } catch (_) {
      try {
        const errMsg = await msg(lang,
          '❌ An internal error occurred.',
          '❌ Ein interner Fehler ist aufgetreten.'
        );
        await sock.sendMessage(message?.key?.remoteJid || chatId, { text: formatMessage(errMsg, 'supportreply', chatId) });
      } catch (_) { /* silent */ }
    }
  }
};
