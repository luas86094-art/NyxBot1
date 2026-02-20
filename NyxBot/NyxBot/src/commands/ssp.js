import { formatMessage, isOwner, hasTeamRank } from '../utils/helpers.js';
import db from '../database/db.js';

/**
 * ssp (Schere Stein Papier) command
 * - Fixes logic bugs for advantage handling
 * - Prevents in-process concurrent executions per user
 * - Normalizes sync/async DB API by awaiting Promise.resolve(...)
 * - Applies XP change and lastSsp update atomically on the user object
 */

const COOLDOWN_MS = Number(process.env.SSP_COOLDOWN_MS) || 60 * 1000; // default 1 minute
const userLocks = new Set(); // in-process lock; not sufficient for multi-instance

const BEATS = {               // key beats value
  'scissors': 'paper',
  'rock': 'scissors',
  'paper': 'rock'
};

function getResult(userChoice, botChoice) {
  if (userChoice === botChoice) return 'draw';
  return BEATS[userChoice] === botChoice ? 'win' : 'lose';
}

// Returns the choice that LOSES to playerChoice (i.e. what playerChoice beats)
function getLosingChoice(playerChoice) {
  return BEATS[playerChoice];
}

// Returns the choice that WINS against playerChoice (i.e. what beats playerChoice)
function getWinningChoice(playerChoice) {
  return Object.keys(BEATS).find(choice => BEATS[choice] === playerChoice);
}

export default {
  name: 'ssp',
  registrationRequired: true,
  description: 'Play Rock Paper Scissors',

  async execute({ sock, chatId, lid, phoneNumber, args = [], lang }) {
    if (!sock || !chatId || !lid) {
      console.error('ssp: missing required params', { chatId, lid });
      return;
    }

    // prevent concurrent runs in this process for the same user
    if (userLocks.has(lid)) {
      const busyMsg = lang === 'de'
        ? '⏳ Du spielst gerade. Bitte warte einen Moment.'
        : '⏳ You are already playing. Please wait a moment.';
      try { await sock.sendMessage(chatId, { text: formatMessage(busyMsg, 'ssp', chatId) }); } catch (e) { console.error('sendMessage failed', e); }
      return;
    }
    userLocks.add(lid);

    try {
      const user = await Promise.resolve(db.getUser(lid));
      if (!user) {
        const notReg = lang === 'de' ? '❌ Du bist nicht registriert.' : '❌ You are not registered.';
        await sock.sendMessage(chatId, { text: formatMessage(notReg, 'ssp', chatId) });
        return;
      }

      const last = Number(user.lastSsp || 0);
      const diff = Date.now() - last;
      if (diff < COOLDOWN_MS) {
        const leftSec = Math.ceil((COOLDOWN_MS - diff) / 1000);
        const waitMsg = lang === 'de'
          ? `⏳ Bitte warte ${leftSec} Sekunde${leftSec > 1 ? 'n' : ''}, bevor du erneut spielst.`
          : `⏳ Please wait ${leftSec} second${leftSec > 1 ? 's' : ''} before playing again.`;
        await sock.sendMessage(chatId, { text: formatMessage(waitMsg, 'ssp', chatId) });
        return;
      }

      if (!args[0]) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ?
            '❌ Nutze: .ssp [schere/stein/papier]\n\nBeispiele:\n.ssp schere\n.ssp stein\n.ssp papier' :
            '❌ Use: .ssp [scissors/rock/paper]\n\nExamples:\n.ssp scissors\n.ssp rock\n.ssp paper', 'ssp', chatId)
        });
        return;
      }

      const choicesMap = {
        'schere': 'scissors',
        'scissors': 'scissors',
        'stein': 'rock',
        'rock': 'rock',
        'papier': 'paper',
        'paper': 'paper'
      };

      const raw = String(args[0]).trim().toLowerCase();
      const userChoice = choicesMap[raw];

      if (!userChoice) {
        await sock.sendMessage(chatId, {
          text: formatMessage(lang === 'de' ?
            '❌ Ungültige Wahl! Nutze: schere, stein oder papier' :
            '❌ Invalid choice! Use: scissors, rock or paper', 'ssp', chatId)
        });
        return;
      }

      // permissions / team advantage
      const owner = isOwner ? isOwner(lid, phoneNumber) : false;
      const team = hasTeamRank ? hasTeamRank(lid) : false;
      const hasAdvantage = owner || team;

      let botChoice;
      if (hasAdvantage) {
        const r = Math.random();
        if (r < 0.45) {
          // make bot intentionally lose -> user wins
          botChoice = getLosingChoice(userChoice);
        } else if (r < 0.78) {
          // draw
          botChoice = userChoice;
        } else {
          // bot wins
          botChoice = getWinningChoice(userChoice);
        }
      } else {
        const arr = ['scissors', 'rock', 'paper'];
        botChoice = arr[Math.floor(Math.random() * arr.length)];
      }

      const result = getResult(userChoice, botChoice);

      const emojis = {
        'scissors': '✂️',
        'rock': '🪨',
        'paper': '📄'
      };

      const names = {
        'scissors': lang === 'de' ? 'Schere' : 'Scissors',
        'rock': lang === 'de' ? 'Stein' : 'Rock',
        'paper': lang === 'de' ? 'Papier' : 'Paper'
      };

      let resultText = '';
      let xpChange = 0;

      if (result === 'win') {
        xpChange = 50;
        resultText = lang === 'de' ? '🎉 Du hast gewonnen! +50 XP' : '🎉 You won! +50 XP';
      } else if (result === 'lose') {
        xpChange = -25;
        resultText = lang === 'de' ? '😢 Du hast verloren! -25 XP' : '😢 You lost! -25 XP';
      } else {
        resultText = lang === 'de' ? '🤝 Unentschieden!' : '🤝 Draw!';
      }

      // Apply XP change atomically on user object and persist in one update
      user.xp = Math.max(0, (Number(user.xp) || 0) + xpChange);
      user.lastSsp = Date.now();

      // Persist user. Support sync or async DB methods
      await Promise.resolve(db.updateUser(lid, user));

      // Keep a fallback if db.addUserXP exists (optional)
      if (typeof db.addUserXP === 'function') {
        // ensure DB XP is consistent - prefer the updateUser above; call addUserXP optionally
        try { await Promise.resolve(db.addUserXP(lid, xpChange)); } catch (e) { /* ignore, we've updated user already */ }
      }

      const responseText = lang === 'de' ?
        `*✂️🪨📄 Schere Stein Papier*\n\n` +
        `👤 *Deine Wahl:* ${emojis[userChoice]} ${names[userChoice]}\n` +
        `🤖 *Bot Wahl:* ${emojis[botChoice]} ${names[botChoice]}\n\n` +
        `${resultText}\n\n` +
        `💎 *Aktuelles XP:* ${user.xp}` +
        (hasAdvantage ? '\n\n✨ *Team-Bonus:* Höhere Gewinnchance!' : '')
        :
        `*✂️🪨📄 Rock Paper Scissors*\n\n` +
        `👤 *Your choice:* ${emojis[userChoice]} ${names[userChoice]}\n` +
        `🤖 *Bot choice:* ${emojis[botChoice]} ${names[botChoice]}\n\n` +
        `${resultText}\n\n` +
        `💎 *Current XP:* ${user.xp}` +
        (hasAdvantage ? '\n\n✨ *Team Bonus:* Higher win chance!' : '');

      await sock.sendMessage(chatId, { text: formatMessage(responseText, 'ssp', chatId) });
    } catch (err) {
      console.error('ssp command error', err);
      const fallback = (lang === 'de') ? '❌ Ein interner Fehler ist aufgetreten.' : '❌ An internal error occurred.';
      try { await sock.sendMessage(chatId, { text: formatMessage(fallback, 'ssp', chatId) }); } catch (_) { /* silent */ }
    } finally {
      userLocks.delete(lid);
    }
  }
};
