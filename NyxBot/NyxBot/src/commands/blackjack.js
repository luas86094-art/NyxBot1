import fs from 'fs';
import path from 'path';
import { formatMessage, randomInt, isVIP } from '../utils/helpers.js';
import db from '../database/db.js';

const SESSIONS_FILE = path.join(path.resolve('./data'), 'blackjack_sessions.json');

function ensureSessionsFile() {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2));
  } catch (_) {}
}

function loadSessions() {
  try {
    ensureSessionsFile();
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (_) {
    return {};
  }
}
function saveSessions(s) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(s, null, 2));
  } catch (_) {}
}

const cardsList = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const getCard = () => cardsList[randomInt(0, cardsList.length - 1)];
const getCardValue = (card) => {
  if (card === 'A') return 11;
  if (['J','Q','K'].includes(card)) return 10;
  return parseInt(card, 10);
};
const calculateTotal = (cards) => {
  let total = 0, aces = 0;
  cards.forEach(c => {
    const v = getCardValue(c);
    total += v;
    if (c === 'A') aces++;
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
};

export default {
  name: 'blackjack',
  registrationRequired: true,
  description: 'Play Blackjack (start a new session). Usage: .blackjack [Cash/XP] [amount]',

  async execute({ sock, chatId, lid, phoneNumber, args = [], lang }) {
    try {
      const user = db.getUser(lid);
      const vipStatus = isVIP(lid, phoneNumber);

      const COOLDOWN_NORMAL = 30 * 60 * 1000;
      const COOLDOWN_VIP = 10 * 60 * 1000;
      const cooldown = vipStatus ? COOLDOWN_VIP : COOLDOWN_NORMAL;

      if (!user) {
        const msg = lang === 'de' ? '❌ Du bist nicht registriert.' : '❌ You are not registered.';
        await sock.sendMessage(chatId, { text: formatMessage(msg, 'blackjack', chatId) });
        return;
      }

      if (user.lastBlackjack) {
        const timeSince = Date.now() - user.lastBlackjack;
        if (timeSince < cooldown) {
          const timeLeft = Math.ceil((cooldown - timeSince) / 60000);
          const vipBadge = vipStatus ? '👑 ' : '';
          const text = lang === 'de' ?
            `⏰ ${vipBadge}Cooldown aktiv!\n\nDu kannst Blackjack in ${timeLeft} Minuten wieder spielen.\n\n${vipStatus ? '👑 VIP Cooldown: 10 Minuten' : '⏱️ Normaler Cooldown: 30 Minuten\n💡 VIP-User haben nur 10 Minuten Cooldown!'}` :
            `⏰ ${vipBadge}Cooldown active!\n\nYou can play Blackjack again in ${timeLeft} minutes.\n\n${vipStatus ? '👑 VIP Cooldown: 10 minutes' : '⏱️ Normal cooldown: 30 minutes\n💡 VIP users have only 10 minutes cooldown!'}`;
          await sock.sendMessage(chatId, { text: formatMessage(text, 'blackjack', chatId) });
          return;
        }
      }

      if (args.length < 2) {
        const usage = lang === 'de' ?
          '❌ Nutze: .blackjack [XP/Cash] [Betrag]\n\nBeispiele:\n.blackjack Cash 100\n.blackjack XP 50' :
          '❌ Use: .blackjack [XP/Cash] [Amount]\n\nExamples:\n.blackjack Cash 100\n.blackjack XP 50';
        await sock.sendMessage(chatId, { text: formatMessage(usage, 'blackjack', chatId) });
        return;
      }

      const type = args[0].toLowerCase();
      const bet = parseInt(args[1], 10);

      if (type !== 'cash' && type !== 'xp') {
        const m = lang === 'de' ? '❌ Wähle Cash oder XP!' : '❌ Choose Cash or XP!';
        await sock.sendMessage(chatId, { text: formatMessage(m, 'blackjack', chatId) });
        return;
      }
      if (isNaN(bet) || bet < 1) {
        const m = lang === 'de' ? '❌ Mindestens 1 setzen!' : '❌ Minimum bet is 1!';
        await sock.sendMessage(chatId, { text: formatMessage(m, 'blackjack', chatId) });
        return;
      }
      if (type === 'cash' && user.money < bet) {
        const m = lang === 'de' ? `❌ Nicht genug Geld! Du hast: ${user.money}💰` : `❌ Not enough money! You have: ${user.money}💰`;
        await sock.sendMessage(chatId, { text: formatMessage(m, 'blackjack', chatId) });
        return;
      }
      if (type === 'xp' && user.xp < bet) {
        const m = lang === 'de' ? `❌ Nicht genug XP! Du hast: ${user.xp} XP` : `❌ Not enough XP! You have: ${user.xp} XP`;
        await sock.sendMessage(chatId, { text: formatMessage(m, 'blackjack', chatId) });
        return;
      }

      // Load sessions and check if user already has one
      const sessions = loadSessions();
      if (sessions[lid]) {
        const m = lang === 'de' ? '❗ Du hast bereits ein offenes Spiel. Nutze .hit oder .stand.' : '❗ You already have an open game. Use .hit or .stand.';
        await sock.sendMessage(chatId, { text: formatMessage(m, 'blackjack', chatId) });
        return;
      }

      // Deduct bet immediately (lock funds)
      if (type === 'cash') {
        user.money -= bet;
      } else {
        user.xp -= bet;
      }
      db.updateUser(lid, user);

      // Deal initial cards
      const playerCards = [getCard(), getCard()];
      const dealerCards = [getCard(), getCard()];

      const playerTotal = calculateTotal(playerCards);

      // If player has 21 immediately -> handle natural blackjack specially
      if (playerTotal === 21) {
        // Natural Blackjack only if player has exactly 2 cards
        const playerHasNatural = playerCards.length === 2;
        const dealerHasNatural = (dealerCards.length === 2) && (calculateTotal(dealerCards) === 21);

        // Both natural -> push (return stake)
        if (playerHasNatural && dealerHasNatural) {
          if (type === 'cash') user.money += bet;
          else user.xp += bet;

          user.lastBlackjack = Date.now();
          db.updateUser(lid, user);

          const currency = type === 'cash' ? '💰' : '⭐';
          const currencyName = type === 'cash' ? (lang === 'de' ? 'Geld' : 'Money') : 'XP';
          const balance = type === 'cash' ? user.money : user.xp;

          const summary = lang === 'de' ?
            `🃏 *Blackjack Ergebnis* (${currencyName})\n\n👤 Deine Karten: ${playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer Karten: ${dealerCards.join(', ')} = ${calculateTotal(dealerCards)}\n\n🤝 Unentschieden (beide Natural Blackjack).\n\nEinsatz zurück: ${bet}${currency}\n${currencyName}: ${balance}${currency}` :
            `🃏 *Blackjack Result* (${currencyName})\n\n👤 Your cards: ${playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer cards: ${dealerCards.join(', ')} = ${calculateTotal(dealerCards)}\n\n🤝 Draw (both Natural Blackjack).\n\nBet returned: ${bet}${currency}\n${currencyName}: ${balance}${currency}`;

          await sock.sendMessage(chatId, { text: formatMessage(summary, 'blackjack', chatId) });
          return;
        }

        // Player natural & dealer not -> player wins 3:2 payout
        if (playerHasNatural && !dealerHasNatural) {
          // payout 3:2 => total returned = bet * 2.5
          const payout = Math.floor(bet * 2.5);

          if (type === 'cash') user.money += payout;
          else user.xp += payout;

          user.lastBlackjack = Date.now();
          db.updateUser(lid, user);

          const currency = type === 'cash' ? '💰' : '⭐';
          const currencyName = type === 'cash' ? (lang === 'de' ? 'Geld' : 'Money') : 'XP';
          const balance = type === 'cash' ? user.money : user.xp;

          const summary = lang === 'de' ?
            `🃏 *Blackjack Ergebnis* (${currencyName})\n\n👤 Deine Karten: ${playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer Karten: ${calculateTotal(dealerCards)}\n\n🎉 Natural Blackjack! Du gewinnst 3:2.\n\nEinsatz: ${bet}${currency}\nGewinn (inkl. Einsatz): ${payout}${currency}\n${currencyName}: ${balance}${currency}` :
            `🃏 *Blackjack Result* (${currencyName})\n\n👤 Your cards: ${playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer cards: ${calculateTotal(dealerCards)}\n\n🎉 Natural Blackjack! You win 3:2 payout.\n\nBet: ${bet}${currency}\nPayout (incl. bet): ${payout}${currency}\n${currencyName}: ${balance}${currency}`;

          await sock.sendMessage(chatId, { text: formatMessage(summary, 'blackjack', chatId) });
          return;
        }

        // Otherwise (playerTotal === 21 but NOT a natural) -> dealer plays normally
        const dealer = dealerCards.slice();
        let dealerTotal = calculateTotal(dealer);
        while (dealerTotal < 17) {
          dealer.push(getCard());
          dealerTotal = calculateTotal(dealer);
        }

        // determine outcome
        let resultText = '';
        let payout = 0;
        if (dealerTotal > 21) {
          resultText = lang === 'de' ? '🎉 Dealer überkauft! Gewonnen!' : '🎉 Dealer bust! You won!';
          payout = bet * 2;
        } else if (playerTotal > dealerTotal) {
          resultText = lang === 'de' ? '🎉 Gewonnen!' : '🎉 You won!';
          payout = bet * 2;
        } else if (playerTotal === dealerTotal) {
          resultText = lang === 'de' ? '🤝 Unentschieden!' : '🤝 Draw!';
          payout = bet;
        } else {
          resultText = lang === 'de' ? '❌ Verloren!' : '❌ You lost!';
          payout = 0;
        }

        // payout (bet was deducted at start)
        if (type === 'cash') user.money += payout;
        else user.xp += payout;
        user.lastBlackjack = Date.now();
        db.updateUser(lid, user);

        const currency = type === 'cash' ? '💰' : '⭐';
        const currencyName = type === 'cash' ? (lang === 'de' ? 'Geld' : 'Money') : 'XP';
        const balance = type === 'cash' ? user.money : user.xp;

        const summary = lang === 'de' ?
          `🃏 *Blackjack Ergebnis* (${currencyName})\n\n👤 Deine Karten: ${playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer Karten: ${dealer.join(', ')} = ${dealerTotal}\n\n${resultText}\n\nEinsatz: ${bet}${currency}\n${payout > bet ? `Gewinn: ${payout - bet}${currency}` : payout > 0 ? 'Einsatz zurück' : `Verlust: ${bet}${currency}`}\n${currencyName}: ${balance}${currency}` :
          `🃏 *Blackjack Result* (${currencyName})\n\n👤 Your cards: ${playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer cards: ${dealer.join(', ')} = ${dealerTotal}\n\n${resultText}\n\nBet: ${bet}${currency}\n${payout > bet ? `Win: ${payout - bet}${currency}` : payout > 0 ? 'Bet returned' : `Loss: ${bet}${currency}`}\n${currencyName}: ${balance}${currency}`;

        await sock.sendMessage(chatId, { text: formatMessage(summary, 'blackjack', chatId) });
        return;
      }

      // store session (player didn't have 21 immediately)
      const session = {
        lid,
        type,
        bet,
        playerCards,
        dealerCards,
        createdAt: Date.now()
      };
      sessions[lid] = session;
      saveSessions(sessions);

      const currency = type === 'cash' ? '💰' : '⭐';
      const currencyName = type === 'cash' ? (lang === 'de' ? 'Geld' : 'Money') : 'XP';
      const balance = type === 'cash' ? user.money : user.xp;

      const text = lang === 'de' ?
        `🃏 *Blackjack gestartet* (${currencyName})\n\n👤 Deine Karten: ${playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer zeigt: ${dealerCards[0]}\n\nNutze .hit um eine Karte zu ziehen oder .stand um zu halten.\n\nEinsatz: ${bet}${currency}\n${currencyName}: ${balance}${currency}` :
        `🃏 *Blackjack started* (${currencyName})\n\n👤 Your cards: ${playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer shows: ${dealerCards[0]}\n\nUse .hit to draw or .stand to hold.\n\nBet: ${bet}${currency}\n${currencyName}: ${balance}${currency}`;

      await sock.sendMessage(chatId, { text: formatMessage(text, 'blackjack', chatId) });
    } catch (_) {
      try {
        const err = lang === 'de' ? '❌ Ein interner Fehler ist aufgetreten.' : '❌ An internal error occurred.';
        await sock.sendMessage(chatId, { text: formatMessage(err, 'blackjack', chatId) });
      } catch (_) {}
    }
  }
};
