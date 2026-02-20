import { formatMessage, isOwner, extractPhoneNumber } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'removeteamrank',
  registrationRequired: true,
  description: 'Remove team rank (owner only)',
  
  async execute({ sock, chatId, phoneNumber, mentions, args, lang, senderId }) {
    if (!isOwner(lid, phoneNumber)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'ownerOnly'))
      });
      return;
    }

    const teamranks = db.read('teamranks');

    if (!args[0]) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `📊 *Team-Ränge entfernen*\n\n` +
          `Nutze: .removeteamrank @user [rang]\n` +
          `Oder: .removeteamrank [rang] @user\n\n` +
          `Verfügbare Ränge:\n${teamranks.ranks.map((r, i) => `${i + 1}. ${r}`).join('\n')}` :
          `📊 *Remove Team Ranks*\n\n` +
          `Use: .removeteamrank @user [rank]\n` +
          `Or: .removeteamrank [rank] @user\n\n` +
          `Available ranks:\n${teamranks.ranks.map((r, i) => `${i + 1}. ${r}`).join('\n')}`)
      });
      return;
    }

    let targetJid = null;
    let rank = null;

    if (mentions && mentions.length > 0) {
      targetJid = mentions[0];
      rank = args.filter(arg => !arg.startsWith('@')).join(' ');
    } else {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Bitte tagge einen User!\n\nNutze: .removeteamrank @user [rang]` :
          `❌ Please tag a user!\n\nUse: .removeteamrank @user [rank]`)
      });
      return;
    }

    if (!rank || rank.trim() === '') {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Bitte gib einen Rang an!\n\nVerfügbare Ränge:\n${teamranks.ranks.join('\n')}` :
          `❌ Please specify a rank!\n\nAvailable ranks:\n${teamranks.ranks.join('\n')}`)
      });
      return;
    }

    if (!teamranks.ranks.includes(rank)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Ungültiger Rang: "${rank}"\n\n` +
          `Verfügbare Ränge:\n${teamranks.ranks.map((r, i) => `${i + 1}. ${r}`).join('\n')}` :
          `❌ Invalid rank: "${rank}"\n\n` +
          `Available ranks:\n${teamranks.ranks.map((r, i) => `${i + 1}. ${r}`).join('\n')}`)
      });
      return;
    }

    const targetLid = targetJid.split('@')[0];
    const targetUser = db.getUser(targetLid);
    
    if (!targetUser.teamRanks || targetUser.teamRanks.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⚠️ @${targetLid} hat keine Team-Ränge!` :
          `⚠️ @${targetLid} has no team ranks!`),
        mentions: [targetJid]
      });
      return;
    }
    
    if (!targetUser.teamRanks.includes(rank)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⚠️ @${targetLid} hat den Rang "${rank}" nicht!\n\n` +
          `📊 Aktuelle Ränge: ${targetUser.teamRanks.join(', ')}` :
          `⚠️ @${targetLid} doesn't have the rank "${rank}"!\n\n` +
          `📊 Current ranks: ${targetUser.teamRanks.join(', ')}`),
        mentions: [targetJid]
      });
      return;
    }
    
    const updatedRanks = targetUser.teamRanks.filter(r => r !== rank);
    db.updateUser(targetLid, { teamRanks: updatedRanks });

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Team-Rang erfolgreich entfernt!\n\n` +
        `👤 User: @${targetLid}\n` +
        `🗑️ Entfernter Rang: ${rank}\n` +
        `📊 Verbleibende Ränge: ${updatedRanks.length > 0 ? updatedRanks.join(', ') : 'Keine'}` :
        `✅ Team rank successfully removed!\n\n` +
        `👤 User: @${targetLid}\n` +
        `🗑️ Removed rank: ${rank}\n` +
        `📊 Remaining ranks: ${updatedRanks.length > 0 ? updatedRanks.join(', ') : 'None'}`),
      mentions: [targetJid]
    });
  }
};
