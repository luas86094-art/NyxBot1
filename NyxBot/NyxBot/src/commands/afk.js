import { formatMessage } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';
import db from '../database/db.js';

export default {
  name: 'afk',
  registrationRequired: true,
  description: 'Set AFK mode',
  
  async execute({ sock, chatId, lid, args, lang }) {
    const afkData = db.read('afk');
    const reason = args.join(' ') || (lang === 'de' ? 'Keine Angabe' : 'No reason');

    afkData[lid] = {
      reason,
      time: Date.now()
    };
    db.write('afk', afkData);

    await sock.sendMessage(chatId, {
      text: formatMessage(translate(lang, 'afkEnabled', { reason }))
    });
  }
};
