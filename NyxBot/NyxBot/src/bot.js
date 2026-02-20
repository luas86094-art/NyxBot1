import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import db from './database/db.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleGroupUpdate } from './handlers/groupHandler.js';

const logger = pino({ 
  level: 'silent'
}).child({ class: 'baileys' });

logger.trace = () => {};

export const botState = {
  startTime: Date.now(),
  sock: null,
  reconnectAttempts: 0,
  pairingCodeRequested: false
};

export async function connectBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`📦 Using Baileys version: ${version.join('.')}`);
    console.log(`✅ Latest version: ${isLatest ? 'Yes' : 'No'}`);

    const sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      browser: Browsers.macOS('Desktop'),
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      getMessage: async (key) => {
        return { conversation: '' };
      },
      defaultQueryTimeoutMs: 90000,
      connectTimeoutMs: 90000,
      keepAliveIntervalMs: 10000,
      retryRequestDelayMs: 5000
    });

    botState.sock = sock;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║         📱 QR-CODE ZUM SCANNEN            ║');
        console.log('╚═══════════════════════════════════════════╝\n');
        
        qrcode.generate(qr, { small: true });
        
        console.log('\n📝 So verbindest du den Bot:');
        console.log('   1. Öffne WhatsApp auf deinem Handy');
        console.log('   2. Gehe zu Einstellungen → Verknüpfte Geräte');
        console.log('   3. Tippe auf "Gerät verknüpfen"');
        console.log('   4. Scanne den QR-Code OBEN\n');
        console.log('💡 Der QR-Code wird alle paar Sekunden erneuert!\n');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.output?.payload?.error || 'Unknown';
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`❌ Connection closed: ${reason}`);
        console.log(`📊 Status code: ${statusCode}`);
        console.log(`🔄 Should reconnect: ${shouldReconnect}`);
        
        botState.pairingCodeRequested = false;
        
        if (shouldReconnect) {
          botState.reconnectAttempts++;
          const delay = Math.min(5000 * botState.reconnectAttempts, 30000);
          console.log(`⏳ Reconnecting in ${delay/1000}s (attempt ${botState.reconnectAttempts})...`);
          setTimeout(() => connectBot(), delay);
        } else {
          console.log('🚫 Logged out. Please scan QR code again.');
          botState.reconnectAttempts = 0;
        }
      } else if (connection === 'open') {
        botState.reconnectAttempts = 0;
        botState.pairingCodeRequested = false;
        console.log('✅ Bot connected successfully!');
        console.log('✅ Bot is now online and ready!');
        console.log(`👑 Owner: ${db.getSettings().owner}`);
      } else if (connection === 'connecting') {
        console.log('🔄 Connecting to WhatsApp...');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      
      for (const message of messages) {
        try {
          await handleMessage(sock, message);
        } catch (error) {
          console.error('❌ Error handling message:', error.message);
        }
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      try {
        await handleGroupUpdate(sock, update);
      } catch (error) {
        console.error('❌ Error handling group update:', error.message);
      }
    });

    return sock;
  } catch (error) {
    console.error('❌ Fatal error in connectBot:', error);
    botState.reconnectAttempts++;
    const delay = Math.min(10000 * botState.reconnectAttempts, 60000);
    console.log(`⏳ Retrying in ${delay/1000}s...`);
    setTimeout(() => connectBot(), delay);
  }
}

export async function sendMessage(sock, jid, content, options = {}) {
  try {
    return await sock.sendMessage(jid, content, options);
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    return null;
  }
}
