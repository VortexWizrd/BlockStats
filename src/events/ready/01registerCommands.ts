import { Client, Events, REST, Routes } from "discord.js";
import path from "path";
import fs from "fs";
require('dotenv').config();

const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = {
    data: {
            type: Events.ClientReady,
            once: false,
    },
    execute(client: Client): void {
        const localCommands = getLocalCommands();
        const commands = [];
        for (const command of localCommands) {
            commands.push(command.data.toJSON());
        }

        const rest = new REST().setToken(String(process.env.CLIENT_TOKEN));

        (async () => {
            try {
                console.log(`Started refreshing ${localCommands.length} application (/) commands.`);

                const clientId = String(process.env.CLIENT_ID);
                const guildId = String(process.env.GUILD_ID);

                const data = await rest.put(
			        Routes.applicationGuildCommands(clientId, guildId),
			        { body: commands },
		        );

                if (data instanceof Array) {
                    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
                } else {
                    console.log(`Successfully reloaded application (/) commands.`);
                }
            } catch (error) {
                console.error(error);
            }
        })();
    }
}