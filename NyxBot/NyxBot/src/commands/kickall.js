import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import { sleep } from '../utils/helpers.js';

export default {
  name: 'kickall',
  registrationRequired: true,
  description: 'Kick all members from group (team only)',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    const isTeam = hasTeamRank(lid);
    const owner = isOwner(lid, phoneNumber);

    if (!isTeam && !owner) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'teamOnly'))
      });
      return;
    }

    try {
      const groupMeta = await sock.groupMetadata(chatId);
      const participants = groupMeta.participants
        .filter(p => !p.admin && p.id !== senderId)
        .map(p => p.id);

      if (participants.length === 0) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            'Keine Mitglieder zum Kicken!' :
            'No members to kick!')
        });
        return;
      }

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⚠️ Kicke ${participants.length} Mitglieder...` :
          `⚠️ Kicking ${participants.length} members...`)
      });

      for (const participant of participants) {
        try {
          await sock.groupParticipantsUpdate(chatId, [participant], 'remove');
          await sleep(1000);
        } catch (error) {
          console.error(`Error kicking ${participant}:`, error);
        }
      }

      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ Alle Mitglieder wurden gekickt!' :
          '✅ All members kicked!')
      });
    } catch (error) {
      console.error('Error in kickall:', error);
    }
  }
};
