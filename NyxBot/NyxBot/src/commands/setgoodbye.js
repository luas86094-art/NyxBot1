import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'setgoodbye',
  aliases: ['goodbyeset'],
  registrationRequired: true,
  description: 'Set goodbye message',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, args, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
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

    if (!args[0]) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          'Nutze: .setgoodbye [text]\nNutze @user für den Benutzernamen!' :
          'Use: .setgoodbye [text]\nUse @user for the username!')
      });
      return;
    }

    const message = args.join(' ');
    const groupData = db.getGroup(chatId);
    groupData.goodbye.message = message;
    db.updateGroup(chatId, groupData);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Abschiedsnachricht gesetzt!\n\n${message.replace('@user', '@beispiel')}` :
        `✅ Goodbye message set!\n\n${message.replace('@user', '@example')}`)
    });
  }
};
