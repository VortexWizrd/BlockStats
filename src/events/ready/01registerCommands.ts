import { Client, Events, REST, Routes } from "discord.js";
import path from "path";
import getAllFiles from "../../utils/getAllFiles";
require("dotenv").config();

module.exports = {
    data: {
        type: Events.ClientReady,
        once: false,
    },
    execute(client: Client): void {
        const commandCategories = getAllFiles(
            path.join(__dirname, "../../commands"),
            true
        );
        const commands = [];
        for (const category of commandCategories) {
            const commandFiles = getAllFiles(category);
            for (const file of commandFiles) {
                commands.push(require(file).data.toJSON());
            }
        }

        const rest = new REST().setToken(String(process.env.CLIENT_TOKEN));

        (async () => {
            try {
                console.log(
                    `Started refreshing ${commands.length} application (/) commands.`
                );

                const clientId = String(process.env.CLIENT_ID);
                const guildId = String(process.env.GUILD_ID);

                const data = await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: commands }
                );

                if (data instanceof Array) {
                    console.log(
                        `Successfully reloaded ${data.length} application (/) commands.`
                    );
                } else {
                    console.log(
                        `Successfully reloaded application (/) commands.`
                    );
                }
            } catch (error) {
                console.error(error);
            }
        })();
    },
};
