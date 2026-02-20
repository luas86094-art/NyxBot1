import { formatMessage, isOwner } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'setvip',
  registrationRequired: true,
  description: 'Give VIP status to user (owner only)',
  
  async execute({ sock, chatId, phoneNumber, mentions, args, lang }) {
    if (!isOwner(lid, phoneNumber)) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nur der Owner kann diesen Befehl nutzen!' :
          '❌ Only the owner can use this command!', 'setvip', chatId)
      });
      return;
    }

    if (!mentions || mentions.length === 0) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .setvip @user\n\n👑 Gibt dem User VIP-Rechte:\n• Höhere Gewinnchancen im Slot\n• VIP-Badge 👑\n\nZum Entfernen: .setvip @user remove' :
          '❌ Use: .setvip @user\n\n👑 Gives user VIP rights:\n• Higher slot win chances\n• VIP badge 👑\n\nTo remove: .setvip @user remove', 'setvip', chatId)
      });
      return;
    }

    const targetJid = mentions[0];
    const targetLid = targetJid.split('@')[0];
    const user = db.getUser(targetLid);

    const removeVip = args.length > 0 && args[args.length - 1].toLowerCase() === 'remove';

    if (removeVip) {
      db.updateUser(targetLid, { vip: false });
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `✅ VIP-Status wurde @${targetLid} entfernt!` :
          `✅ VIP status removed from @${targetLid}!`, 'setvip', chatId),
        mentions: [targetJid]
      });
    } else {
      db.updateUser(targetLid, { vip: true });
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `👑 VIP-Status wurde @${targetLid} gegeben!\n\n✅ Vorteile:\n• Höhere Slot-Gewinnchancen\n• VIP-Badge 👑` :
          `👑 VIP status given to @${targetLid}!\n\n✅ Benefits:\n• Higher slot win chances\n• VIP badge 👑`, 'setvip', chatId),
        mentions: [targetJid]
      });
    }
  }
};
