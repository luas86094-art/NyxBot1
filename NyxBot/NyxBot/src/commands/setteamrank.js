import { formatMessage, isOwner, extractPhoneNumber } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'setteamrank',
  registrationRequired: true,
  description: 'Set team rank (owner only)',
  
  async execute({ sock, chatId, phoneNumber, mentions, args, lang, senderId }) {
    const lid = senderId.split('@')[0];
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
          `📊 *Team-Ränge*\n\n` +
          `Nutze: .setteamrank @user [rang]\n` +
          `Oder: .setteamrank [rang] @user\n\n` +
          `Verfügbare Ränge:\n${teamranks.ranks.map((r, i) => `${i + 1}. ${r}`).join('\n')}` :
          `📊 *Team Ranks*\n\n` +
          `Use: .setteamrank @user [rank]\n` +
          `Or: .setteamrank [rank] @user\n\n` +
          `Available ranks:\n${teamranks.ranks.map((r, i) => `${i + 1}. ${r}`).join('\n')}`)
      });
      return;
    }

    let targetJid = null;
    let rank = null;

    if (mentions && mentions.length > 0) {
      targetJid = mentions[0];
      
      const rankArgs = args.filter(arg => {
        const argLower = arg.toLowerCase();
        return !argLower.includes('@') && 
               arg.trim() !== '' && 
               !arg.match(/^\d+$/);
      });
      
      rank = rankArgs.join(' ').trim();
    } else {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Bitte tagge einen User!\n\nNutze: .setteamrank @user [rang]\nOder: .setteamrank [rang] @user` :
          `❌ Please tag a user!\n\nUse: .setteamrank @user [rank]\nOr: .setteamrank [rank] @user`)
      });
      return;
    }

    if (!rank || rank.trim() === '') {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Bitte gib einen Rang an!\n\nBeispiel: .setteamrank @user Designer\n\nVerfügbare Ränge:\n${teamranks.ranks.join('\n')}` :
          `❌ Please specify a rank!\n\nExample: .setteamrank @user Designer\n\nAvailable ranks:\n${teamranks.ranks.join('\n')}`)
      });
      return;
    }

    const exactMatch = teamranks.ranks.find(r => r === rank);
    const caseInsensitiveMatch = teamranks.ranks.find(r => r.toLowerCase() === rank.toLowerCase());
    
    if (!exactMatch) {
      if (caseInsensitiveMatch) {
        rank = caseInsensitiveMatch;
      } else {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `❌ Ungültiger Rang: "${rank}"\n\n` +
            `💡 Tipp: Achte auf Groß-/Kleinschreibung!\n\n` +
            `Verfügbare Ränge:\n${teamranks.ranks.map((r, i) => `${i + 1}. ${r}`).join('\n')}` :
            `❌ Invalid rank: "${rank}"\n\n` +
            `💡 Tip: Pay attention to capitalization!\n\n` +
            `Available ranks:\n${teamranks.ranks.map((r, i) => `${i + 1}. ${r}`).join('\n')}`)
        });
        return;
      }
    }

    const targetLid = targetJid.split('@')[0];
    const targetUser = db.getUser(targetLid);
    
    if (!targetUser.teamRanks) {
      targetUser.teamRanks = [];
    }
    
    if (targetUser.teamRanks.includes(rank)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `⚠️ @${targetLid} hat bereits den Rang "${rank}"!\n\n` +
          `📊 Aktuelle Ränge: ${targetUser.teamRanks.join(', ') || 'Keine'}` :
          `⚠️ @${targetLid} already has the rank "${rank}"!\n\n` +
          `📊 Current ranks: ${targetUser.teamRanks.join(', ') || 'None'}`),
        mentions: [targetJid]
      });
      return;
    }
    
    if (rank === 'Owner') {
      db.updateUser(targetLid, { vip: true });
    }
    
    const oldRanks = [...targetUser.teamRanks];
    targetUser.teamRanks.push(rank);
    db.updateUser(targetLid, { teamRanks: targetUser.teamRanks });

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Team-Rang erfolgreich hinzugefügt!\n\n` +
        `👤 User: @${targetLid}\n` +
        `🏆 Hinzugefügter Rang: ${rank}\n` +
        `📊 Alle Ränge: ${targetUser.teamRanks.join(', ')}` :
        `✅ Team rank successfully added!\n\n` +
        `👤 User: @${targetLid}\n` +
        `🏆 Added rank: ${rank}\n` +
        `📊 All ranks: ${targetUser.teamRanks.join(', ')}`),
      mentions: [targetJid]
    });
  }
};
