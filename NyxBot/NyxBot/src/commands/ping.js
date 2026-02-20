import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'ping',
  registrationRequired: true,
  description: 'Check bot latency',
  
  async execute(context) {
    const { sock, chatId, reply } = context;
    console.log(`Executing ping command in ${chatId}`);
    const start = Date.now();
    
    const sendReply = reply || (async (text) => sock.sendMessage(chatId, { text: formatMessage(text) }));

    const sent = await sendReply('Pinging...');
    const latency = Date.now() - start;
    
    if (sent && sent.key) {
      await sock.sendMessage(chatId, {
        text: formatMessage(`🏓 Pong!\nLatency: ${latency}ms`),
        edit: sent.key
      });
    } else {
      await sendReply(`🏓 Pong!\nLatency: ${latency}ms`);
    }
  }
};
