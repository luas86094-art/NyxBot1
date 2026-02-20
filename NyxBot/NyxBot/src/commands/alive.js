import { formatMessage, formatUptime } from '../utils/helpers.js';
import { botState } from '../bot.js';

export default {
  name: 'alive',
  registrationRequired: true,
  description: 'Check if bot is online',
  
  async execute({ sock, chatId }) {
    const start = Date.now();
    await sock.presenceSubscribe(chatId);
    const ping = Date.now() - start;
    
    const uptime = Date.now() - botState.startTime;
    const roundTrip = ping * 2;
    
    const text = `✅ Bot is online!\n\n` +
      `⏱️ Response Time: ${ping}ms\n` +
      `🔄 Round Trip: ${roundTrip}ms\n` +
      `⏰ Uptime: ${formatUptime(uptime)}`;
    
    await sock.sendMessage(chatId, {
      text: formatMessage(text)
    });
  }
};
