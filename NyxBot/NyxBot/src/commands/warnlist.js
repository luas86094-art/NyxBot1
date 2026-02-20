import { formatMessage } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'warnlist',
  registrationRequired: true,
  description: 'Show all warnings in group',
  
  async execute({ sock, chatId, isGroup, lang }) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: formatMessage(translate(lang, 'groupOnly'))
      });
      return;
    }

    const warnings = db.getWarnings(chatId);
    const maxWarns = db.getGroupWarnLimit(chatId);

    if (!warnings || Object.keys(warnings).length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '✅ Keine Warnungen in dieser Gruppe!' :
          '✅ No warnings in this group!', 'warnlist', chatId)
      });
      return;
    }

    const sortedWarnings = Object.entries(warnings)
      .sort((a, b) => a[1].count - b[1].count);

    let message = lang === 'de' ? 
      `⚠️ *Warnungen in dieser Gruppe* (Max: ${maxWarns})\n\n` :
      `⚠️ *Warnings in this group* (Max: ${maxWarns})\n\n`;

    sortedWarnings.forEach(([phoneNumber, data], index) => {
      message += `${index + 1}. @${phoneNumber} - ${data.count}/${maxWarns} ${lang === 'de' ? 'Warnungen' : 'warnings'}\n`;
    });

    const mentionsList = sortedWarnings.map(([phoneNumber]) => `${phoneNumber}@s.whatsapp.net`);

    await sock.sendMessage(chatId, {
      text: formatMessage(message, 'warnlist', chatId),
      mentions: mentionsList
    });
  }
};
