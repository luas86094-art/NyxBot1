import db from '../database/db.js';
import { formatMessage, getLanguage, getUserMention } from '../utils/helpers.js';

export async function handleGroupUpdate(sock, update) {
  try {
    const { id: groupId, participants, action } = update;

    const groupData = db.getGroup(groupId);
    const lang = getLanguage(groupId);

    if (action === 'add' && groupData.welcome.enabled) {
      for (const participant of participants) {
        const welcomeText = groupData.welcome.message.replace('@user', getUserMention(participant));
        await sock.sendMessage(groupId, {
          text: formatMessage(welcomeText),
          mentions: [participant]
        });
      }
    }

    if (action === 'remove' && groupData.goodbye.enabled) {
      for (const participant of participants) {
        const goodbyeText = groupData.goodbye.message.replace('@user', getUserMention(participant));
        await sock.sendMessage(groupId, {
          text: formatMessage(goodbyeText),
          mentions: [participant]
        });
      }
    }

    if (action === 'pending') {
      const groupJoinRequests = db.getGroupJoinRequests(groupId);
      
      for (const participant of participants) {
        const phoneNumber = participant.split('@')[0];
        
        if (!groupJoinRequests.find(r => r.participant === participant)) {
          db.addGroupJoinRequest(groupId, {
            participant,
            phoneNumber,
            requestedAt: Date.now()
          });
        }
      }

      const pendingCount = db.getGroupJoinRequests(groupId).length;
      const messageText = lang === 'de' ?
        `🔔 *Neue Beitrittsanfrage(n)!*\n\n` +
        `📊 Wartende Anfragen: ${pendingCount}\n\n` +
        `Befehle (nur für Admins):\n` +
        `• .joinlist - Alle Anfragen anzeigen\n` +
        `• .joinaccept [index] - Anfrage akzeptieren\n` +
        `• .joinreject [index] - Anfrage ablehnen\n` +
        `• .joinacceptall - Alle akzeptieren\n` +
        `• .joinrejectall - Alle ablehnen` :
        `🔔 *New Join Request(s)!*\n\n` +
        `📊 Pending Requests: ${pendingCount}\n\n` +
        `Commands (admins only):\n` +
        `• .joinlist - Show all requests\n` +
        `• .joinaccept [index] - Accept request\n` +
        `• .joinreject [index] - Reject request\n` +
        `• .joinacceptall - Accept all\n` +
        `• .joinrejectall - Reject all`;

      await sock.sendMessage(groupId, {
        text: formatMessage(messageText)
      });
    }
  } catch (error) {
    console.error('Error in group handler:', error);
  }
}
