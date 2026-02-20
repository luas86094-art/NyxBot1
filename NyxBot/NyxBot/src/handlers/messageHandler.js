import db from '../database/db.js';
import { formatMessage, getPrefix, getLanguage, extractPhoneNumber, isOwner, isUrl, hasTeamRank } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import { loadCommands } from '../commands/index.js';

let commands = null;

// Hilfsfunktion zum Normalisieren von JIDs (privat und Gruppe)
function normalizeJid(jid) {
  if (!jid) return jid;
  if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net')) return jid;
  const match = /^(\d+)@/.exec(jid);
  if (match) return `${match[1]}@s.whatsapp.net`;
  return jid;
}

async function getCommands() {
  if (!commands) {
    commands = await loadCommands();
  }
  return commands;
}

export async function handleMessage(sock, message) {
  try {
    if (!message.message) return;
    if (message.key.fromMe) return;

    const isGroup = message.key.remoteJid.endsWith('@g.us');
    // Immer normalisieren!
    const chatId = normalizeJid(message.key.remoteJid);
    const senderIdRaw = message.key.participant || message.key.remoteJid;
    const senderId = normalizeJid(senderIdRaw);
    const lid = senderIdRaw.split('@')[0];
    const phoneNumber = extractPhoneNumber(senderIdRaw);

    if (message.message.viewOnceMessageV2 || message.message.viewOnceMessage) {
      const viewOnceMsg = message.message.viewOnceMessageV2 || message.message.viewOnceMessage;
      const innerMessage = viewOnceMsg.message;
      
      db.saveViewOnceMessage(message.key.id, {
        chatId,
        senderId,
        lid,
        phoneNumber,
        message: innerMessage,
        timestamp: Date.now()
      });
    }

    if (db.isBlacklisted(phoneNumber) && isGroup) {
      try {
        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
      } catch (error) {
        console.error('Error kicking blacklisted user:', error);
      }
      return;
    }

    const messageType = Object.keys(message.message)[0];
    const messageContent = 
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      message.message.imageMessage?.caption ||
      message.message.videoMessage?.caption ||
      '';

    console.log(`📩 [${chatId}] Message from ${senderId}: ${messageContent}`);

    if (!messageContent) return;

    const prefix = getPrefix(chatId);
    const lang = getLanguage(chatId);

    // Support only the configured prefix
    const effectivePrefix = prefix;

    const isBotOwner = isOwner(lid, phoneNumber);

    if (isGroup) {
      const groupData = db.getGroup(chatId);
      if (groupData.antilink && !isBotOwner) {
        const groupMeta = await sock.groupMetadata(chatId);
        const isAdmin = groupMeta.participants.find(p => normalizeJid(p.id) === senderId)?.admin;
        const isTeam = hasTeamRank(lid);
        
        if (!isAdmin && !isTeam && isUrl(messageContent)) {
          const linkAllowance = db.getLinkAllowance(chatId, lid);
          
          if (linkAllowance > 0) {
            const remaining = db.decreaseLinkAllowance(chatId, lid);
            await sock.sendMessage(chatId, { 
              text: formatMessage(lang === 'de' ? 
                `⚠️ Link erkannt! Du hast noch ${remaining} Link-Erlaubnis(se) übrig.` :
                `⚠️ Link detected! You have ${remaining} link allowance(s) remaining.`),
              mentions: [senderId]
            });
            return;
          }
          
          await sock.sendMessage(chatId, { 
            text: formatMessage(translate(lang, 'linkDetected'))
          });
          try {
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
          } catch (error) {
            console.error('Error kicking user for link:', error);
          }
          return;
        }
      }
    }

    const afkData = db.read('afk');
    if (afkData[lid] && !messageContent.startsWith(effectivePrefix)) {
      delete afkData[lid];
      db.write('afk', afkData);
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'afkDisabled')),
        quoted: message
      });
    }

    // Alle Mentions normalisieren! 
    const mentionsRaw = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const mentions = mentionsRaw.map(normalizeJid);
    for (let i = 0; i < mentions.length; i++) {
      const mentionedJid = mentions[i];
      const mentionedLid = mentionedJid.split('@')[0];
      if (afkData[mentionedLid]) {
        const afkReason = afkData[mentionedLid].reason || 'No reason';
        const mentionedUser = `@${mentionedLid}`;
        await sock.sendMessage(chatId, {
          text: formatMessage(translate(lang, 'userAfk', { mentionedUser, reason: afkReason })),
          mentions: [mentionedJid],
          quoted: message
        });
      }
    }

    // Auto-reply to "gay" messages
    if (messageContent.toLowerCase().includes('gay') && !messageContent.startsWith(effectivePrefix)) {
      const gayMessage = `|￣￣￣￣￣￣￣|
|⠀⠀⠀ 𝗚𝗔𝗬!!⠀⠀⠀|
|＿＿＿＿＿＿＿|
  
(\\__/) ||
(•ㅅ•) ||
/ 　 づ
)`;
      await sock.sendMessage(chatId, { text: gayMessage, quoted: message });
    }

    if (!messageContent.startsWith(effectivePrefix)) {
      const user = db.getUser(lid);
      if (user.registered) {
        user.stats.messages += 1;
        const updatedUser = db.addXP(lid, 5);
        db.updateUser(lid, { stats: user.stats });
        
        if (updatedUser.level > user.level) {
          await sock.sendMessage(chatId, {
            text: formatMessage(translate(lang, 'levelUp', { level: updatedUser.level })),
            mentions: [senderId],
            quoted: message
          });
        }
      }
      return;
    }

    const args = messageContent.slice(effectivePrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const customText = db.getCommandText(commandName);
    if (customText) {
      const user = db.getUser(lid);
      if (!user.registered && commandName !== 'reg' && commandName !== 'register' && commandName !== 'help') {
        await sock.sendMessage(chatId, {
          text: formatMessage(translate(lang, 'notRegistered'), commandName, chatId),
          quoted: message
        });
        return;
      }
      
      await sock.sendMessage(chatId, {
        text: formatMessage(customText, commandName, chatId),
        quoted: message
      });
      
      if (user.registered) {
        user.stats.commands += 1;
        const updatedUser = db.addXP(lid, 7);
        db.updateUser(lid, { stats: user.stats });
      }
      return;
    }

    const commandsMap = await getCommands();
    const command = commandsMap.get(commandName);

    console.log(`🤖 Attempting to execute command: "${commandName}". Found: ${!!command}`);

    if (!command) {
      console.log(`❓ Command "${commandName}" not found in commandsMap.`);
      return;
    }

    if (command.registrationRequired) {
      const user = db.getUser(lid);
      if (!user.registered && commandName !== 'reg' && commandName !== 'register' && commandName !== 'help') {
        await sock.sendMessage(chatId, {
          text: formatMessage(translate(lang, 'notRegistered'), commandName, chatId),
          quoted: message
        });
        return;
      }
    }

    const sockProxy = new Proxy(sock, {
      get(target, prop) {
        if (prop === 'sendMessage') {
          return async (jid, content, options) => {
            // Immer JID normalisieren!
            jid = normalizeJid(jid);
            if (jid === chatId && content && typeof content === 'object' && !('quoted' in content) && !('edit' in content)) {
              content = { ...content, quoted: message };
            }
            // auch in content.mentions normalisieren, falls vorhanden
            if (content.mentions && Array.isArray(content.mentions)) {
              content.mentions = content.mentions.map(normalizeJid);
            }
            return target.sendMessage(jid, content, options);
          };
        }
        return target[prop];
      }
    });

    const context = {
      sock: sockProxy,
      rawSock: sock,
      message,
      chatId,
      senderId,
      lid,
      phoneNumber,
      isGroup,
      args,
      prefix,
      lang,
      command: commandName,
      fullMessage: messageContent,
      quoted: message.message.extendedTextMessage?.contextInfo?.quotedMessage,
      mentions,
      
      reply: async (text, options = {}) => {
        try {
          console.log(`Sending reply to ${chatId}: ${typeof text === 'string' ? text.substring(0, 50) : 'object'}...`);
          const messageConfig = typeof text === 'string' ? { text: formatMessage(text, commandName, chatId) } : text;
          // mentions in options rausziehen und ggf. normalisieren
          if (options.mentions && Array.isArray(options.mentions)) {
            options.mentions = options.mentions.map(normalizeJid);
          }
          const result = await sock.sendMessage(chatId, {
            ...messageConfig,
            ...options
          });
          console.log(`Reply sent successfully! ID: ${result?.key?.id}`);
          return result;
        } catch (error) {
          console.error(`Error in context.reply for command ${commandName}:`, error);
          const messageConfig = typeof text === 'string' ? { text: formatMessage(text, commandName, chatId) } : text;
          if (options.mentions && Array.isArray(options.mentions)) {
            options.mentions = options.mentions.map(normalizeJid);
          }
          return await sock.sendMessage(chatId, {
            ...messageConfig,
            ...options
          });
        }
      }
    };

    try {
      console.log(`🚀 Executing command "${commandName}" for ${senderId} in ${chatId}...`);
      await command.execute(context);
      console.log(`✅ Command "${commandName}" finished execution.`);
      
      const user = db.getUser(lid);
      if (user.registered) {
        user.stats.commands += 1;
        const updatedUser = db.addXP(lid, 7);
        db.updateUser(lid, { stats: user.stats });
      }
    } catch (error) {
      console.error(`❌ Error executing command "${commandName}":`, error);
      await sock.sendMessage(chatId, {
        text: formatMessage(`An error occurred while executing the "${commandName}" command.`, commandName, chatId),
        quoted: message
      });
    }
  } catch (error) {
    console.error('Error in message handler:', error);
  }
}

