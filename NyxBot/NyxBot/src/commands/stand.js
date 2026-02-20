import fs from 'fs';
import path from 'path';
import { formatMessage, randomInt } from '../utils/helpers.js';
import db from '../database/db.js';

const SESSIONS_FILE = path.join(path.resolve('./data'), 'blackjack_sessions.json');

function loadSessions() {
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (_) { return {}; }
}
function saveSessions(s) {
  try { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(s, null, 2)); } catch (_) {}
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
  name: 'stand',
  registrationRequired: true,
  description: 'Finish the round and let the dealer play',

  async execute({ sock, chatId, lid, lang }) {
    try {
      const sessions = loadSessions();
      const session = sessions[lid];
      if (!session) {
        const m = lang === 'de' ? '❌ Du hast kein offenes Blackjack-Spiel. Starte eines mit .blackjack' : '❌ You have no open Blackjack game. Start one with .blackjack';
        await sock.sendMessage(chatId, { text: formatMessage(m, 'blackjack', chatId) });
        return;
      }

      // Reveal dealer cards and play
      const dealerCards = session.dealerCards.slice();
      let dealerTotal = calculateTotal(dealerCards);
      while (dealerTotal < 17) {
        dealerCards.push(getCard());
        dealerTotal = calculateTotal(dealerCards);
      }

      const playerTotal = calculateTotal(session.playerCards);

      // determine outcome
      let resultText = '';
      let payout = 0; // payout to add back to user (including stake when win/draw)
      if (playerTotal > 21) {
        resultText = lang === 'de' ? '❌ Überkauft! Du hast verloren.' : '❌ Bust! You lost.';
        payout = 0;
      } else if (dealerTotal > 21) {
        resultText = lang === 'de' ? '🎉 Dealer überkauft! Gewonnen!' : '🎉 Dealer bust! You won!';
        payout = session.bet * 2;
      } else if (playerTotal > dealerTotal) {
        resultText = lang === 'de' ? '🎉 Gewonnen!' : '🎉 You won!';
        payout = session.bet * 2;
      } else if (playerTotal === dealerTotal) {
        resultText = lang === 'de' ? '🤝 Unentschieden!' : '🤝 Draw!';
        payout = session.bet;
      } else {
        resultText = lang === 'de' ? '❌ Verloren!' : '❌ You lost!';
        payout = 0;
      }

      // pay out: we subtracted bet at start, so add payout now
      const user = db.getUser(lid);
      if (user) {
        if (session.type === 'cash') {
          user.money += payout;
        } else {
          user.xp += payout;
        }
        user.lastBlackjack = Date.now();
        db.updateUser(lid, user);
      }

      // delete session
      delete sessions[lid];
      saveSessions(sessions);

      const currency = session.type === 'cash' ? '💰' : '⭐';
      const currencyName = session.type === 'cash' ? (lang === 'de' ? 'Geld' : 'Money') : 'XP';
      const balance = user ? (session.type === 'cash' ? user.money : user.xp) : 0;

      const summary = lang === 'de' ?
        `🃏 *Blackjack Ergebnis* (${currencyName})\n\n👤 Deine Karten: ${session.playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer Karten: ${dealerCards.join(', ')} = ${dealerTotal}\n\n${resultText}\n\nEinsatz: ${session.bet}${currency}\n${payout > session.bet ? `Gewinn: ${payout - session.bet}${currency}` : payout > 0 ? 'Einsatz zurück' : `Verlust: ${session.bet}${currency}`}\n${currencyName}: ${balance}${currency}` :
        `🃏 *Blackjack Result* (${currencyName})\n\n👤 Your cards: ${session.playerCards.join(', ')} = ${playerTotal}\n🤖 Dealer cards: ${dealerCards.join(', ')} = ${dealerTotal}\n\n${resultText}\n\nBet: ${session.bet}${currency}\n${payout > session.bet ? `Win: ${payout - session.bet}${currency}` : payout > 0 ? 'Bet returned' : `Loss: ${session.bet}${currency}`}\n${currencyName}: ${balance}${currency}`;

      await sock.sendMessage(chatId, { text: formatMessage(summary, 'blackjack', chatId) });
    } catch (_) {
      try {
        const err = lang === 'de' ? '❌ Ein interner Fehler ist aufgetreten.' : '❌ An internal error occurred.';
        await sock.sendMessage(chatId, { text: formatMessage(err, 'blackjack', chatId) });
      } catch (_) {}
    }
  }
};
