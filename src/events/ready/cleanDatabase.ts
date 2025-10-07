import { Client, Events } from 'discord.js';
import cleanDatabase from '../../utils/cleanDatabase';

module.exports = {
    data: {
        type: Events.ClientReady,
        once: true,
    },
    execute(client: Client): void {
        cleanDatabase();
        setInterval(cleanDatabase, 60 * 60 * 1000);
    }
}