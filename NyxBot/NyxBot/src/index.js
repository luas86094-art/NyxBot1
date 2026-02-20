import { connectBot } from './bot.js';
import db from './database/db.js';

console.log('╔═══════════════════════════════════════════╗');
console.log('║              NyxBot🐍                     ║');
console.log('║     WhatsApp Bot mit Baileys              ║');
console.log('╚═══════════════════════════════════════════╝');
console.log('');

async function main() {
  try {
    console.log('⚙️  Initializing database...');
    db.initializeFiles();
    
    console.log('📡 Connecting to WhatsApp...');
    await connectBot();
    
    console.log('');
    console.log('✅ Bot is running!');
    console.log('📱 Scan the QR code above to connect');
    console.log('');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

main();
