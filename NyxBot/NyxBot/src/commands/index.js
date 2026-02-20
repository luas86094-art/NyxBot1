import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadCommands() {
  const commands = new Map();
  const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

  for (const file of commandFiles) {
    try {
      const command = await import(join(__dirname, file));
      if (command.default && command.default.name) {
        commands.set(command.default.name, command.default);
        if (command.default.aliases) {
          command.default.aliases.forEach(alias => {
            commands.set(alias, command.default);
          });
        }
      }
    } catch (error) {
      console.error(`Error loading command ${file}:`, error);
    }
  }

  console.log(`✓ Loaded ${commands.size} commands`);
  return commands;
}
