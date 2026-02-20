import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'tagall',
  registrationRequired: true,
  description: 'Tag all group members',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, args, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    try {
      const groupMeta = await sock.groupMetadata(chatId);
      const isAdmin = groupMeta.participants.find(p => p.id === senderId)?.admin;
      const isTeam = hasTeamRank(lid);
      const owner = isOwner(lid, phoneNumber);

      if (!isAdmin && !isTeam && !owner) {
        await sock.sendMessage(chatId, {
          text: formatMessage(translate(lang, 'adminOnly'))
        });
        return;
      }

      const message = args.join(' ') || (lang === 'de' ? 'Ankündigung' : 'Announcement');
      const mentions = groupMeta.participants.map(p => p.id);

      await sock.sendMessage(chatId, {
        text: formatMessage(`📢 ${message}`),
        mentions
      });
    } catch (error) {
      console.error('Error in tagall:', error);
    }
  }
};
