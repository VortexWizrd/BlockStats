import { Client, Events } from "discord.js";

module.exports = {
    data: {
        type: Events.ClientReady,
        once: true,
    },
    execute(client: Client): void {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
    },
};
