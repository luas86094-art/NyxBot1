import db from '../database/db.js';

export function formatMessage(text, commandName = null, chatId = null) {
  let design = db.getMessageDesign();
  
  if (typeof design === 'string') {
    design = {
      header: '',
      footer: design,
      template: null
    };
  }
  
  if (commandName && chatId) {
    const commandDesign = db.getCommandDesign(commandName, chatId);
    if (commandDesign) {
      if (typeof commandDesign === 'string') {
        design = {
          header: '',
          footer: commandDesign,
          template: null
        };
      } else {
        design = {
          header: commandDesign.header !== undefined && commandDesign.header !== '' ? commandDesign.header : design.header,
          footer: commandDesign.footer !== undefined && commandDesign.footer !== '' ? commandDesign.footer : design.footer,
          template: commandDesign.template || design.template
        };
      }
    }
  }
  
  if (design.template) {
    return design.template.replaceAll('{text}', text);
  }
  
  let result = text;
  
  if (design.header) {
    result = `${design.header}\n\n${result}`;
  }
  
  if (design.footer) {
    result = `${result}\n\n${design.footer}`;
  }
  
  return result;
}

export function getPrefix(chatId) {
  if (chatId.endsWith('@g.us')) {
    const group = db.getGroup(chatId);
    return group.prefix || '/';
  }
  const settings = db.getSettings();
  return settings.defaultPrefix || '/';
}

export function getLanguage(chatId) {
  if (chatId.endsWith('@g.us')) {
    const group = db.getGroup(chatId);
    return group.language || 'en';
  }
  return 'en';
}

export function isOwner(lid, phoneNumber = null) {
  const settings = db.getSettings();
  
  // Check LID first (highest priority)
  if (lid === settings.ownerLid) return true;
  
  // Fallback to phone number if provided
  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const ownerPhone = settings.owner.replace(/[^0-9]/g, '');
    return cleanPhone === ownerPhone;
  }
  
  return false;
}

export function hasTeamRank(lid) {
  const user = db.getUser(lid);
  return user.teamRanks && user.teamRanks.length > 0;
}

export function isVIP(lid, phoneNumber = null) {
  if (isOwner(lid, phoneNumber)) return true;
  const user = db.getUser(lid);
  return user.vip === true || (user.teamRanks && user.teamRanks.length > 0);
}

export function isDesigner(lid) {
  const user = db.getUser(lid);
  return user.teamRanks && user.teamRanks.includes('Designer');
}

export function isOverOwner(lid) {
  const user = db.getUser(lid);
  return user.teamRanks && user.teamRanks.includes('Over Owner');
}

export function getTeamRankLevel(rank) {
  const teamranks = db.read('teamranks');
  const index = teamranks.ranks.indexOf(rank);
  return index >= 0 ? index : -1;
}

export function canUseTeamCommand(lid, minRank) {
  const user = db.getUser(lid);
  if (!user.teamRanks || user.teamRanks.length === 0) return false;
  
  const minRankLevel = getTeamRankLevel(minRank);
  
  return user.teamRanks.some(rank => {
    const userRankLevel = getTeamRankLevel(rank);
    return userRankLevel >= minRankLevel;
  });
}

export function extractPhoneNumber(jid) {
  const beforeAt = jid.split('@')[0];
  const beforeColon = beforeAt.split(':')[0];
  return beforeColon.replace(/[^0-9]/g, '');
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function isUrl(text) {
  if (typeof text !== 'string') return false;
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  return urlRegex.test(text);
}

export function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.match(urlRegex) || [];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getUserMention(jid) {
  return `@${jid.split('@')[0]}`;
}

export function parseMention(text) {
  const mentionRegex = /@(\d+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1] + '@s.whatsapp.net');
  }
  return mentions;
}
