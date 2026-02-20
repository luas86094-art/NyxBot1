import { formatMessage, randomInt, isVIP } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'slot',
  registrationRequired: true,
  description: 'Play slot machine with Cash or XP',
  
  async execute({ sock, chatId, lid, phoneNumber, args, lang }) {
    const user = db.getUser(lid);
    const vipStatus = isVIP(lid, phoneNumber);

    const COOLDOWN_NORMAL = 30 * 60 * 1000;
    const COOLDOWN_VIP = 10 * 60 * 1000;
    const cooldown = vipStatus ? COOLDOWN_VIP : COOLDOWN_NORMAL;

    if (user.lastSlot) {
      const timeSince = Date.now() - user.lastSlot;
      if (timeSince < cooldown) {
        const timeLeft = Math.ceil((cooldown - timeSince) / 60000);
        const vipBadge = vipStatus ? '👑 ' : '';
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ? 
            `⏰ ${vipBadge}Cooldown aktiv!\n\n` +
            `Du kannst Slot in ${timeLeft} Minuten wieder spielen.\n\n` +
            `${vipStatus ? '👑 VIP Cooldown: 10 Minuten' : '⏱️ Normaler Cooldown: 30 Minuten\n💡 VIP-User haben nur 10 Minuten Cooldown!'}` :
            `⏰ ${vipBadge}Cooldown active!\n\n` +
            `You can play Slot again in ${timeLeft} minutes.\n\n` +
            `${vipStatus ? '👑 VIP Cooldown: 10 minutes' : '⏱️ Normal Cooldown: 30 minutes\n💡 VIP users have only 10 minutes cooldown!'}`, 'slot', chatId)
        });
        return;
      }
    }

    if (args.length < 2) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Nutze: .slot [XP/Cash] [Betrag]\n\nBeispiele:\n.slot Cash 100\n.slot XP 50' :
          '❌ Use: .slot [XP/Cash] [Amount]\n\nExamples:\n.slot Cash 100\n.slot XP 50', 'slot', chatId)
      });
      return;
    }

    const type = args[0].toLowerCase();
    const bet = parseInt(args[1]);

    if (type !== 'cash' && type !== 'xp') {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Wähle Cash oder XP!' :
          '❌ Choose Cash or XP!', 'slot', chatId)
      });
      return;
    }

    if (isNaN(bet) || bet < 1) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          '❌ Mindestens 1 setzen!' :
          '❌ Minimum bet is 1!', 'slot', chatId)
      });
      return;
    }

    if (type === 'cash' && user.money < bet) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Nicht genug Geld! Du hast: ${user.money}💰` :
          `❌ Not enough money! You have: ${user.money}💰`, 'slot', chatId)
      });
      return;
    }

    if (type === 'xp' && user.xp < bet) {
      await sock.sendMessage(chatId, {
        text: formatMessage(lang === 'de' ? 
          `❌ Nicht genug XP! Du hast: ${user.xp} XP` :
          `❌ Not enough XP! You have: ${user.xp} XP`, 'slot', chatId)
      });
      return;
    }

    const getSlotSymbol = () => {
      if (vipStatus) {
        const vipSymbols = ['🍒', '🍋', '🍊', '🍇', '💎', '💎', '💎', '7️⃣', '7️⃣', '7️⃣'];
        return vipSymbols[randomInt(0, vipSymbols.length - 1)];
      } else {
        const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
        return symbols[randomInt(0, symbols.length - 1)];
      }
    };

    const slot1 = getSlotSymbol();
    const slot2 = getSlotSymbol();
    const slot3 = getSlotSymbol();

    let winnings = 0;
    if (slot1 === slot2 && slot2 === slot3) {
      if (slot1 === '💎') winnings = bet * 10;
      else if (slot1 === '7️⃣') winnings = bet * 7;
      else winnings = bet * 5;
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      winnings = bet * 2;
    }

    if (type === 'cash') {
      user.money -= bet;
      user.money += winnings;
    } else {
      user.xp -= bet;
      user.xp += winnings;
    }
    
    user.lastSlot = Date.now();
    db.updateUser(lid, user);

    const currency = type === 'cash' ? '💰' : '⭐';
    const balance = type === 'cash' ? user.money : user.xp;
    const currencyName = type === 'cash' ? (lang === 'de' ? 'Geld' : 'Money') : 'XP';
    const vipBadge = vipStatus ? '👑 ' : '';

    const resultText = lang === 'de' ?
      `🎰 *Spielautomat* (${currencyName}) ${vipBadge}\n\n` +
      `[ ${slot1} | ${slot2} | ${slot3} ]\n\n` +
      `Einsatz: ${bet}${currency}\n` +
      `${winnings > 0 ? `🎉 Gewonnen: ${winnings}${currency}` : '❌ Verloren!'}\n` +
      `${currencyName}: ${balance}${currency}`
      :
      `🎰 *Slot Machine* (${currencyName}) ${vipBadge}\n\n` +
      `[ ${slot1} | ${slot2} | ${slot3} ]\n\n` +
      `Bet: ${bet}${currency}\n` +
      `${winnings > 0 ? `🎉 Won: ${winnings}${currency}` : '❌ Lost!'}\n` +
      `${currencyName}: ${balance}${currency}`;

    await sock.sendMessage(chatId, {
      text: formatMessage(resultText, 'slot', chatId)
    });
  }
};
