import { formatMessage } from '../utils/helpers.js';

export default {
  name: 'a',
  registrationRequired: true,
  description: 'Measure response time',
  
  async execute({ sock, chatId }) {
    const start = Date.now();
    await sock.sendMessage(chatId, {
      text: formatMessage(`Response time: ${Date.now() - start}ms`)
    });
  }
};
