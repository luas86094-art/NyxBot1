import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'hidetag',
  registrationRequired: true,
  description: 'Hidden tag (team only)',
  
  async execute({ sock, chatId, lid, phoneNumber, args, isGroup, lang }) {
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
      const message = args.join(' ') || (lang === 'de' ? 'Nachricht' : 'Message');
      const mentions = groupMeta.participants.map(p => p.id);

      await sock.sendMessage(chatId, {
        text: formatMessage(`🔔 ${message}`),
        mentions
      });
    } catch (error) {
      console.error('Error in hidetag:', error);
    }
  }
};
