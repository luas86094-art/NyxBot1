import { formatMessage, formatUptime } from '../utils/helpers.js';
import { botState } from '../bot.js';

export default {
  name: 'uptime',
  registrationRequired: true,
  description: 'Check bot uptime',
  
  async execute({ sock, chatId }) {
    const uptime = Date.now() - botState.startTime;
    
    await sock.sendMessage(chatId, {
      text: formatMessage(`⏰ Bot Uptime: ${formatUptime(uptime)}`)
    });
  }
};
