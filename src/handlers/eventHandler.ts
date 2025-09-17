import { Client } from 'discord.js';
import path from 'path';
import getAllFiles from '../utils/getAllFiles';

export default function eventHandler(client: Client): void {
    const eventFolders = getAllFiles(path.join(__dirname, '..', 'events'), true);

    for (const folder of eventFolders) {
        const eventFiles = getAllFiles(folder, false);

        for (const file of eventFiles) {
            const event = require(file);
            if (event.data.once) {
                client.once(event.data.type, (...args) => event.execute(...args));
            } else {
                client.on(event.data.type, (...args) => event.execute(...args));
            }
        }
    }
}