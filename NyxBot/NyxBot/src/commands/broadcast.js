import { formatMessage, isOwner, hasTeamRank, sleep, getLanguage } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import { translateText } from '../utils/translator.js';
import db from '../database/db.js';

export default {
  name: 'broadcast',
  registrationRequired: true,
  description: 'Broadcast message to all groups (team only)',
  
  async execute({ sock, chatId, lid, phoneNumber, args, lang }) {
    const isTeam = hasTeamRank(lid);
    const owner = isOwner(lid, phoneNumber);

    if (!isTeam && !owner) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'teamOnly'))
      });
      return;
    }

    if (!args[0]) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          'Nutze: .broadcast [nachricht]\n\nDie Nachricht wird automatisch in die Gruppensprache übersetzt!' :
          'Use: .broadcast [message]\n\nThe message will be automatically translated to each group\'s language!')
      });
      return;
    }

    const message = args.join(' ');
    const chats = await sock.groupFetchAllParticipating();
    const groups = Object.values(chats).filter(chat => chat.id.endsWith('@g.us'));

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `📡 Sende Broadcast an ${groups.length} Gruppen mit Auto-Übersetzung...` :
        `📡 Broadcasting to ${groups.length} groups with auto-translation...`)
    });

    let sent = 0;
    for (const group of groups) {
      try {
        const groupLang = getLanguage(group.id);
        let translatedMessage = message;
        
        if (groupLang !== lang) {
          const result = await translateText(message, groupLang);
          if (result.success) {
            translatedMessage = result.text;
          }
        }
        
        await sock.sendMessage(group.id, {
          text: formatMessage(`📢 *Broadcast*\n\n${translatedMessage}`)
        });
        sent++;
        await sleep(1000);
      } catch (error) {
        console.error(`Error broadcasting to ${group.id}:`, error);
      }
    }

    await sock.sendMessage(chatId, {
      text: formatMessage(lang === 'de' ? 
        `✅ Broadcast an ${sent}/${groups.length} Gruppen gesendet (mit Auto-Übersetzung)!` :
        `✅ Broadcast sent to ${sent}/${groups.length} groups (with auto-translation)!`)
    });
  }
};
