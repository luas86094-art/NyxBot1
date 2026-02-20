import { formatMessage } from '../utils/helpers.js';
import db from '../database/db.js';

export default {
  name: 'help',
  registrationRequired: false,
  description: 'Show help information',
  
  async execute({ sock, chatId, lang }) {
    const settings = db.getSettings();
    
    const helpText = lang === 'de' ? 
      `🤖 *Invisible Bot Hilfe*\n\n` +
      `📝 *Wichtige Befehle:*\n` +
      `/reg [name.alter] - Registrierung\n` +
      `/help - Diese Hilfe\n` +
      `/menu - Hauptmenü\n` +
      `/ping - Bot-Latenz\n` +
      `/alive - Bot-Status\n` +
      `/uptime - Bot-Laufzeit\n` +
      `/profile - Dein Profil\n` +
      `/level - Dein Level\n` +
      `/shop - Shop anzeigen\n` +
      `/daily - Tägliche Belohnung\n\n` +
      `🎮 *Gaming:*\n` +
      `/slot - Spielautomat\n` +
      `/fischen - Fische fangen\n\n` +
      `🐾 *Haustiere:*\n` +
      `/pet - Haustier-Info\n` +
      `/feed - Haustier füttern\n` +
      `/pethunt - Auf die Jagd\n\n` +
      `👥 *Gruppen (Admins):*\n` +
      `/kick @user - User kicken\n` +
      `/tagall [text] - Alle taggen\n` +
      `/welcome enable/disable\n` +
      `/antilink enable/disable\n\n` +
      `⚙️ *Einstellungen:*\n` +
      `/setlanguage [de/en/...]\n` +
      `/setprefix [zeichen]\n\n` +
      `📞 *Owner Kontakt:*\n` +
      `+${settings.owner}`
      :
      `🤖 *Invisible Bot Help*\n\n` +
      `📝 *Main Commands:*\n` +
      `/reg [name.age] - Register\n` +
      `/help - This help\n` +
      `/menu - Main menu\n` +
      `/ping - Bot latency\n` +
      `/alive - Bot status\n` +
      `/uptime - Bot uptime\n` +
      `/profile - Your profile\n` +
      `/level - Your level\n` +
      `/shop - Show shop\n` +
      `/daily - Daily reward\n\n` +
      `🎮 *Gaming:*\n` +
      `/slot - Slot machine\n` +
      `/fish - Go fishing\n\n` +
      `🐾 *Pets:*\n` +
      `/pet - Pet info\n` +
      `/feed - Feed pet\n` +
      `/pethunt - Pet hunting\n\n` +
      `👥 *Groups (Admins):*\n` +
      `/kick @user - Kick user\n` +
      `/tagall [text] - Tag all\n` +
      `/welcome enable/disable\n` +
      `/antilink enable/disable\n\n` +
      `⚙️ *Settings:*\n` +
      `/setlanguage [de/en/...]\n` +
      `/setprefix [char]\n\n` +
      `📞 *Owner Contact:*\n` +
      `+${settings.owner}`;
    
    await sock.sendMessage(chatId, {
      text: formatMessage(helpText)
    });
  }
};
