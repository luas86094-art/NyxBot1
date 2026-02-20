import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'setprefix',
  registrationRequired: true,
  description: 'Set chat prefix',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, args, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    if (!args[0]) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          'Nutze: .setprefix [zeichen]' :
          'Use: .setprefix [character]')
      });
      return;
    }

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

    const newPrefix = args[0][0];
    db.updateGroup(chatId, { prefix: newPrefix });

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Präfix wurde auf "${newPrefix}" geändert!` :
        `✅ Prefix changed to "${newPrefix}"!`)
    });
  }
};
