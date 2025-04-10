import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

const GUILD_RAIDER_IO_STATS = {
  name: 'guild_stats',
  description: 'List the guild raider io stats',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2]
}

const CHARACTER_STATS = {
  name: 'character_stats',
  description: 'Get character stats',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      type: 3,
      name: 'character_name',
      description: 'Character Name',
      required: true
    },
    {
      type: 3,
      name: 'realm',
      description: 'Realm Name',
      required: true
    }
  ]
}

const ALL_COMMANDS = [GUILD_RAIDER_IO_STATS, CHARACTER_STATS];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
