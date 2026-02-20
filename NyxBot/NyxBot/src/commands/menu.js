import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'menu',
  registrationRequired: true,
  description: 'Show categorized menu',
  
  async execute({ sock, chatId, senderId, lid, args, lang }) {
    const user = db.getUser(lid);
    const now = new Date();
    const timeStr = now.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US');
    const greeting = lang === 'de' ? 
      `Hallo ${user.name}! 👋\n⏰ Aktuelle Zeit: ${timeStr}` :
      `Hello ${user.name}! 👋\n⏰ Current Time: ${timeStr}`;
    
    if (!args[0]) {
      const menuText = lang === 'de' ?
        `${greeting}\n\n` +
        `📋 *Hauptmenü* (117 Befehle)\n\n` +
        `Wähle eine Kategorie:\n\n` +
        `1️⃣ .menu 1 - Allgemein\n` +
        `2️⃣ .menu 2 - Level & Profil\n` +
        `3️⃣ .menu 3 - Wirtschaft\n` +
        `4️⃣ .menu 4 - Haustiere\n` +
        `5️⃣ .menu 5 - Gaming\n` +
        `6️⃣ .menu 6 - Gruppen-Admin\n` +
        `7️⃣ .menu 7 - Gruppen-Features\n` +
        `8️⃣ .menu 8 - Downloads\n` +
        `9️⃣ .menu 9 - Media & Sticker\n` +
        `🔟 .menu 10 - Reaktionen\n` +
        `1️⃣1️⃣ .menu 11 - Bot Team\n` +
        `1️⃣2️⃣ .menu 12 - Bot Owner`
        :
        `${greeting}\n\n` +
        `📋 *Main Menu* (117 Commands)\n\n` +
        `Choose a category:\n\n` +
        `1️⃣ .menu 1 - General\n` +
        `2️⃣ .menu 2 - Level & Profile\n` +
        `3️⃣ .menu 3 - Economy\n` +
        `4️⃣ .menu 4 - Pets\n` +
        `5️⃣ .menu 5 - Gaming\n` +
        `6️⃣ .menu 6 - Group Admin\n` +
        `7️⃣ .menu 7 - Group Features\n` +
        `8️⃣ .menu 8 - Downloads\n` +
        `9️⃣ .menu 9 - Media & Stickers\n` +
        `🔟 .menu 10 - Reactions\n` +
        `1️⃣1️⃣ .menu 11 - Bot Team\n` +
        `1️⃣2️⃣ .menu 12 - Bot Owner`;
      
      await sock.sendMessage(chatId, {
        text: formatMessage(menuText),
        mentions: [senderId]
      });
      return;
    }

    const category = args[0];
    let menuText = '';

    switch(category) {
      case '1':
        menuText = lang === 'de' ?
          `1️⃣ *Allgemeine Befehle*\n\n` +
          `.ping - Bot-Latenz\n` +
          `.alive - Bot-Status\n` +
          `.uptime - Laufzeit\n` +
          `.a - Antwortzeit\n` +
          `.help - Hilfe\n` +
          `.afk [grund] - AFK-Modus\n` +
          `.register - Registrierung\n` +
          `.translate [lang] [text] - Übersetzen\n` +
          `.setup - Gruppen-Einstellungen\n` +
          `.support [text] - support request\n` +
          `.changeage [alter] - alter ändern\n` +
          `.changename [name] - nane ändern\n` +
          `.setbirthday [tt.mm.jjjj] - Geburtstag setzen`
          :
          `1️⃣ *General Commands*\n\n` +
          `.ping - Bot latency\n` +
          `.alive - Bot status\n` +
          `.uptime - Uptime\n` +
          `.a - Response time\n` +
          `.help - Help\n` +
          `.afk [reason] - AFK mode\n` +
          `.register - Registration\n` +
          `.translate [lang] [text] - Translate\n` +
          `.setup - Group settings\n` +
          `.support [text] - support request\n` +
          `.changeage [age] - change age\n` +
          `.changename [name] - change name\n` +
          `.setbirthday [dd.mm.yyyy] - set birthday`;
        break;
      
      case '2':
        menuText = lang === 'de' ?
          `2️⃣ *Level & Profil*\n\n` +
          `.profile - Dein Profil\n` +
          `.level - Level-Info\n` +
          `.rank - Rangliste`
          :
          `2️⃣ *Level & Profile*\n\n` +
          `.profile - Your profile\n` +
          `.level - Level info\n` +
          `.rank - Leaderboard`;
        break;
      
      case '3':
        menuText = lang === 'de' ?
          `3️⃣ *Wirtschaft*\n\n` +
          `.shop - Shop anzeigen\n` +
          `.buy [item] - Item kaufen\n` +
          `.daily - Tägliche Belohnung\n` +
          `.weekly - Wöchentliche Belohnung\n` +
          `.monthly - Monatliche Belohnung\n` +
          `.yearly - Jährliche Belohnung\n` +
          `.bonus - Bonus (12h)\n` +
          `.transfer [cash/xp] [betrag] @user - Senden`
          :
          `3️⃣ *Economy*\n\n` +
          `.shop - Show shop\n` +
          `.buy [item] - Buy item\n` +
          `.daily - Daily reward\n` +
          `.weekly - Weekly reward\n` +
          `.monthly - Monthly reward\n` +
          `.yearly - Yearly reward\n` +
          `.bonus - Bonus (12h)\n` +
          `.transfer [cash/xp] [amount] @user - Send`;
        break;
      
      case '4':
        menuText = lang === 'de' ?
          `4️⃣ *Haustiere*\n\n` +
          `.pet - Haustier-Info\n` +
          `.feed - Füttern\n` +
          `.pethunt - Auf die Jagd`
          :
          `4️⃣ *Pets*\n\n` +
          `.pet - Pet info\n` +
          `.feed - Feed pet\n` +
          `.pethunt - Pet hunting`;
        break;
      
      case '5':
        menuText = lang === 'de' ?
          `5️⃣ *Gaming*\n\n` +
          `.slot [betrag] - Spielautomat 🎰\n` +
          `.blackjack [betrag] - Blackjack 🃏\n` +
          `.ssp [stein/papier/schere] - Schere-Stein-Papier ✊✋✌️\n` +
          `.fish - Fische fangen 🎣`
          :
          `5️⃣ *Gaming*\n\n` +
          `.slot [amount] - Slot machine 🎰\n` +
          `.blackjack [amount] - Blackjack 🃏\n` +
          `.ssp [rock/paper/scissors] - Rock-Paper-Scissors ✊✋✌️\n` +
          `.fish - Go fishing 🎣`;
        break;
      
      case '6':
        menuText = lang === 'de' ?
          `6️⃣ *Gruppen-Admin*\n\n` +
          `.kick @user - User kicken\n` +
          `.kickall - Alle kicken\n` +
          `.promote @user - Admin machen\n` +
          `.demote @user - Admin entfernen\n` +
          `.mute @user - Stummschalten\n` +
          `.unmute @user - Stummschaltung aufheben\n` +
          `.warn @user [grund] - Warnung geben\n` +
          `.warnlist - Warnungen anzeigen\n` +
          `.warnremove @user - Warnung entfernen\n` +
          `.setgroupwarn [anzahl] - Warn-Limit\n` +
          `.selfpromote - Selbst Admin werden\n` +
          `.linkallow - Link-Whitelist`
          :
          `6️⃣ *Group Admin*\n\n` +
          `.kick @user - Kick user\n` +
          `.kickall - Kick all\n` +
          `.promote @user - Make admin\n` +
          `.demote @user - Remove admin\n` +
          `.mute @user - Mute user\n` +
          `.unmute @user - Unmute user\n` +
          `.warn @user [reason] - Warn user\n` +
          `.warnlist - Show warnings\n` +
          `.warnremove @user - Remove warning\n` +
          `.setgroupwarn [count] - Warn limit\n` +
          `.selfpromote - Self promote\n` +
          `.linkallow - Link whitelist`;
        break;
      
      case '7':
        menuText = lang === 'de' ?
          `7️⃣ *Gruppen-Features*\n\n` +
          `.tagall [text] - Alle taggen\n` +
          `.hidetag [text] - Verstecktes Tag\n` +
          `.welcome enable/disable - Willkommensnachricht\n` +
          `.setwelcome [text] - Willkommenstext\n` +
          `.goodbye enable/disable - Abschiedsnachricht\n` +
          `.setgoodbye [text] - Abschiedstext\n` +
          `.antilink enable/disable - Anti-Link\n` +
          `.join [link] - Gruppe beitreten`
          :
          `7️⃣ *Group Features*\n\n` +
          `.tagall [text] - Tag all\n` +
          `.hidetag [text] - Hidden tag\n` +
          `.welcome enable/disable - Welcome message\n` +
          `.setwelcome [text] - Set welcome\n` +
          `.goodbye enable/disable - Goodbye message\n` +
          `.setgoodbye [text] - Set goodbye\n` +
          `.antilink enable/disable - Anti-link\n` +
          `.join [link] - Join group`;
        break;
      
      case '8':
        menuText = lang === 'de' ?
          `8️⃣ *Downloads*\n\n` +
          `.yt [url] - YouTube\n` +
          `.youtube [url] - YouTube\n` +
          `.tiktok [url] - TikTok\n` +
          `.facebook [url] - Facebook\n` +
          `.fb [url] - Facebook\n` +
          `.instagram [url] - Instagram\n` +
          `.ig [url] - Instagram\n` +
          `.spotify [url] - Spotify`
          :
          `8️⃣ *Downloads*\n\n` +
          `.yt [url] - YouTube\n` +
          `.youtube [url] - YouTube\n` +
          `.tiktok [url] - TikTok\n` +
          `.facebook [url] - Facebook\n` +
          `.fb [url] - Facebook\n` +
          `.instagram [url] - Instagram\n` +
          `.ig [url] - Instagram\n` +
          `.spotify [url] - Spotify`;
        break;
      
      case '9':
        menuText = lang === 'de' ?
          `9️⃣ *Media & Sticker*\n\n` +
          `.sticker - Bild zu Sticker\n` +
          `.steal [name] - Sticker klauen\n` +
          `.tp - Sticker zu Bild\n` +
          `.reveal - Einmalansicht aufheben`
          :
          `9️⃣ *Media & Stickers*\n\n` +
          `.sticker - Image to sticker\n` +
          `.steal [name] - Steal sticker\n` +
          `.tp - Sticker to pic\n` +
          `.reveal - Reveal viewonce`;
        break;
      
      case '10':
        menuText = lang === 'de' ?
          `🔟 *Reaktionen*\n\n` +
          `.hug @user - Umarmen\n` +
          `.hugall - Alle umarmen\n` +
          `.kiss @user - Küssen\n` +
          `.kissall - Alle küssen\n` +
          `.slap @user - Schlagen\n` +
          `.slapass @user - Po versohlen\n` +
          `.fuck @user - F*cken\n` +
          `.fuckall - Alle f*cken\n` +
          `.pat @user - User tätscheln\n` +
          `.patall - alle tätscheln\n` +
          `eat @user - User essen\n` +
          `eatall - alle essen\n` +
          `.kill @user - user töten\n` +
          `.killall - alle töten\n`
          :
          `🔟 *Reactions*\n\n` +
          `.hug @user - Hug user\n` +
          `.hugall - Hug all\n` +
          `.kiss @user - Kiss user\n` +
          `.kissall - Kiss all\n` +
          `.slap @user - Slap user\n` +
          `.slapass @user - Slap ass\n` +
          `.fuck @user - F*ck user\n` +
          `.fuckall - F*ck all\n` +
          `.pat @user - pat user\n` +
          `.patall - pat all\n` +
          `.eat @user - eat user\n` +
          `.eatall - eat all\n` +
          `.kill @user - kill user\n` +
          `.killall - kill all`;
        break;
      
      case '11':
        menuText = lang === 'de' ?
          `1️⃣1️⃣ *Bot-Team-Befehle*\n\n` +
          `.setteamrank [rang] @user - Team-Rang hinzufügen\n` +
          `.removeteamrank [rang] @user - Team-Rang entfernen\n` +
          `.broadcast [text] - An alle Gruppen\n` +
          `.setlanguage [sprache] - Sprache\n` +
          `.setprefix [zeichen] - Prefix\n` +
          `.cashadd [betrag] @user - Cash geben\n` +
          `.xpadd [betrag] @user - XP geben\n` +
          `.setvip [0-3] @user - VIP setzen\n` +
          `.setmessagedesign [1-6] - Nachrichtendesign\n` +
          `.tasklist - Task-Liste\n` +
          `.supportreply [support ID] [text] - support antwort\n` +
          `.introduce - Bot stellt sich vor`
          :
          `1️⃣1️⃣ *Bot Team Commands*\n\n` +
          `.setteamrank [rank] @user - Add team rank\n` +
          `.removeteamrank [rank] @user - Remove team rank\n` +
          `.broadcast [text] - To all groups\n` +
          `.setlanguage [lang] - Language\n` +
          `.setprefix [char] - Prefix\n` +
          `.cashadd [amount] @user - Give cash\n` +
          `.xpadd [amount] @user - Give XP\n` +
          `.setvip [0-3] @user - Set VIP\n` +
          `.setmessagedesign [1-6] - Message design\n` +
          `.tasklist - Task list\n` +
          `.supportreply [ID] [text] - support andwort\n` +
          `.introduce - bot introduces itself`;
        break;
      
      case '12':
        menuText = lang === 'de' ?
          `1️⃣2️⃣ *Bot-Owner-Befehle*\n\n` +
          `.reload - Bot neu laden (2-3s)\n` +
          `.restart - Bot neustarten (10s)\n` +
          `.listusers - Registrierte User anzeigen\n` +
          `.blacklist add/remove [nummer]\n` +
          `.joinlist - Beitrittsanfragen\n` +
          `.joinaccept [link] - Anfrage annehmen\n` +
          `.joinacceptall - Alle annehmen\n` +
          `.joinreject [link] - Anfrage ablehnen\n` +
          `.joinrejectall - Alle ablehnen\n` +
          `.groupaccept [link] - Gruppe akzeptieren\n` +
          `.groupreject [link] - Gruppe ablehnen\n` +
          `.setcommandtext [cmd] to [text] - Befehlstext\n` +
          `.setabout [text] - Bot-Info\n` +
          `.setpfp - Profilbild`
          :
          `1️⃣2️⃣ *Bot Owner Commands*\n\n` +
          `.reload - Reload bot (2-3s)\n` +
          `.restart - Restart bot (10s)\n` +
          `.listusers - List registered users\n` +
          `.blacklist add/remove [number]\n` +
          `.joinlist - Join requests\n` +
          `.joinaccept [link] - Accept request\n` +
          `.joinacceptall - Accept all\n` +
          `.joinreject [link] - Reject request\n` +
          `.joinrejectall - Reject all\n` +
          `.groupaccept [link] - Accept group\n` +
          `.groupreject [link] - Reject group\n` +
          `.setcommandtext [cmd] to [text] - Command text\n` +
          `.setabout [text] - Bot info\n` +
          `.setpfp - Profile picture`;
        break;
      
      default:
        menuText = lang === 'de' ? 
          'Ungültige Kategorie! Nutze .menu um alle Kategorien zu sehen.' :
          'Invalid category! Use .menu to see all categories.';
    }

    await sock.sendMessage(chatId, {
      text: formatMessage(menuText)
    });
  }
};
