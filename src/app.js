import 'dotenv/config';
import express from 'express';
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { DiscordRequest } from './utils.js';
import { getGuildList, getCharacterData } from './raider_io.js';
import serverless from "serverless-http";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'guild_stats') {
      await res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      });

      const guildInfo = await getGuildList();

      await DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`,
        {
          body: {
            content: guildInfo
          },
          method: 'PATCH'
        }
      );

      return res.end();
    }

    if (name === 'character_stats') {
      await res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      });

      const characterInfo = await getCharacterData(data.options[0].value, data.options[1].value);

      await DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`,
        {
          body: {
            content: characterInfo
          },
          method: 'PATCH'
        }
      );

      return res.end();
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

export const handler = serverless(app);