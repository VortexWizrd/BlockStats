import { Client, Events, GatewayIntentBits } from 'discord.js';
import eventHandler from './handlers/eventHandler';
import mongoose from 'mongoose';
import cleanDatabase from './utils/cleanDatabase';
require('dotenv').config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
    ],
});

(async () => {
    try {
        await mongoose.connect(String(process.env.MONGODB_URI));
        console.log('Connected to MongoDB');
        eventHandler(client);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
})();



client.login(process.env.CLIENT_TOKEN);