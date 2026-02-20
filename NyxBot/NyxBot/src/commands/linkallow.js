import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'linkallow',
  registrationRequired: false,
  description: 'Give link allowances to a user',
  
  async execute({ sock, chatId, senderId, lid, phoneNumber, args, isGroup, lang, mentions }) {
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

    if (args.length < 1 || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .linkallow [anzahl] @user\n\nBeispiel: .linkallow 5 @user\n\nDies gibt dem User 5 Link-Erlaubnisse.' :
          '❌ Use: .linkallow [amount] @user\n\nExample: .linkallow 5 @user\n\nThis gives the user 5 link allowances.')
      });
      return;
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Bitte gib eine gültige Zahl ein!' :
          '❌ Please enter a valid number!')
      });
      return;
    }

    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];

    db.setLinkAllowance(chatId, targetLid, amount);

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ @${targetLid} hat jetzt ${amount} Link-Erlaubnis(se) in dieser Gruppe erhalten!` :
        `✅ @${targetLid} has been given ${amount} link allowance(s) in this group!`),
      mentions: [targetJid]
    });
  }
};
