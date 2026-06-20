import { Client, GatewayIntentBits } from 'discord.js';
import eventHandler from "./handlers/eventHandler.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
})

export async function startDiscord() {
    await eventHandler(client);
    client.login(process.env.DISCORD_TOKEN);
}

