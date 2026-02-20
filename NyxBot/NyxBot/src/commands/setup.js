import { formatMessage, getPrefix, getLanguage } from '../utils/helpers.js';

export default {
  name: 'setup',
  registrationRequired: false,
  description: 'View group settings',
  
  async execute({ sock, chatId, lang }) {
    const isGroup = chatId.endsWith('@g.us');
    
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Dieser Befehl funktioniert nur in Gruppen!' :
          '❌ This command only works in groups!', 'setup', chatId)
      });
      return;
    }

    try {
      const groupMeta = await sock.groupMetadata(chatId);
      const prefix = getPrefix(chatId);
      const groupLang = getLanguage(chatId);
      
      const languageNames = {
        'de': '🇩🇪 Deutsch',
        'en': '🇬🇧 English',
        'es': '🇪🇸 Español',
        'fr': '🇫🇷 Français',
        'it': '🇮🇹 Italiano',
        'tr': '🇹🇷 Türkçe',
        'ar': '🇸🇦 العربية'
      };

      const groupLanguageDisplay = languageNames[groupLang] || groupLang.toUpperCase();
      
      const editSettings = groupMeta.restrict ? 
        (lang === 'de' ? '🔒 Nur Admins' : '🔒 Admins Only') : 
        (lang === 'de' ? '✅ Alle' : '✅ Everyone');
      
      const sendMessages = groupMeta.announce ? 
        (lang === 'de' ? '🔒 Nur Admins' : '🔒 Admins Only') : 
        (lang === 'de' ? '✅ Alle' : '✅ Everyone');
      
      const addMembers = groupMeta.memberAddMode === 'admin_add' || groupMeta.restrict ? 
        (lang === 'de' ? '🔒 Nur Admins' : '🔒 Admins Only') : 
        (lang === 'de' ? '✅ Alle' : '✅ Everyone');
      
      const inviteViaLink = groupMeta.inviteCode ? 
        (lang === 'de' ? '✅ An' : '✅ On') : 
        (lang === 'de' ? '❌ Aus' : '❌ Off');
      
      const joinRequest = groupMeta.memberAddMode === 'all_member_add' ? 
        (lang === 'de' ? '❌ Aus (Direkt beitreten)' : '❌ Off (Direct join)') : 
        (groupMeta.memberAddMode === 'admin_approval' ? 
          (lang === 'de' ? '✅ An (Admin-Genehmigung)' : '✅ On (Admin approval)') :
          (lang === 'de' ? '🔒 Nur Admins können hinzufügen' : '🔒 Admins only can add'));

      const setupText = lang === 'de' ? 
        `*⚙️ Gruppensetup*\n\n` +
        `*Gruppenname:* ${groupMeta.subject}\n` +
        `*Gruppensprache:* ${groupLanguageDisplay}\n` +
        `*Botpräfix:* \`${prefix}\`\n` +
        `*Mitglieder:* ${groupMeta.participants.length}\n\n` +
        `*🔐 Mitgliederberechtigungen:*\n` +
        `*Gruppeneinstellungen bearbeiten:* ${editSettings}\n` +
        `*Nachrichten senden:* ${sendMessages}\n` +
        `*Mitglieder hinzufügen:* ${addMembers}\n` +
        `*Mit Link einladen:* ${inviteViaLink}\n` +
        `*Beitrittsanfrage:* ${joinRequest}`
        :
        `*⚙️ Group Setup*\n\n` +
        `*Group Name:* ${groupMeta.subject}\n` +
        `*Group Language:* ${groupLanguageDisplay}\n` +
        `*Bot Prefix:* \`${prefix}\`\n` +
        `*Members:* ${groupMeta.participants.length}\n\n` +
        `*🔐 Member Permissions:*\n` +
        `*Edit group settings:* ${editSettings}\n` +
        `*Send messages:* ${sendMessages}\n` +
        `*Add members:* ${addMembers}\n` +
        `*Invite via link:* ${inviteViaLink}\n` +
        `*Join request:* ${joinRequest}`;

      await sock.sendMessage(chatId, {
        text: formatMessage(setupText, 'setup', chatId)
      });

    } catch (error) {
      console.error('Error fetching group metadata:', error);
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Fehler beim Abrufen der Gruppeneinstellungen!' :
          '❌ Error fetching group settings!', 'setup', chatId)
      });
    }
  }
};
