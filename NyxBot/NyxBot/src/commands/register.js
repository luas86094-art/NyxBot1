import db from '../database/db.js';
import { formatMessage } from '../utils/helpers.js';
import { translate } from '../locales/translations.js';

export default {
  name: 'reg',
  aliases: ['register'],
  registrationRequired: false,
  description: 'Register to use the bot',
  
  async execute(context) {
    const { sock, chatId, lid, args, lang, reply } = context;
    console.log(`Executing register command for ${lid} in ${chatId}`);
    const user = db.getUser(lid);
    
    const sendReply = reply || (async (text) => sock.sendMessage(chatId, { text: formatMessage(text) }));

    if (user.registered) {
      await sendReply(translate(lang, 'alreadyRegistered'));
      return;
    }

    if (args.length === 0) {
      await sendReply(translate(lang, 'invalidFormat'));
      return;
    }

    const input = args.join(' ');
    const parts = input.split('.');
    
    if (parts.length !== 2) {
      await sendReply(translate(lang, 'invalidFormat'));
      return;
    }

    const name = parts[0].trim();
    const age = parseInt(parts[1].trim());

    if (!name || isNaN(age)) {
      await sendReply(translate(lang, 'invalidFormat'));
      return;
    }

    db.updateUser(lid, {
      registered: true,
      name,
      age,
      registeredAt: Date.now()
    });

    console.log(`User ${lid} registered as ${name}`);
    await sendReply(translate(lang, 'registered', { name }));
  }
};
