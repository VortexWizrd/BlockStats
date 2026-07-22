import { Client, Events, REST, Routes } from "discord.js";
import path from "path";
import getAllFiles from "../../utils/getAllFiles.js";
import dotenv from "dotenv";
dotenv.config();

export default {
  data: {
    type: Events.ClientReady,
    once: false,
  },
  async execute(client: Client): Promise<void> {
    const commandCategories = getAllFiles(
      path.join(import.meta.dirname, "../../commands"),
      true,
    );
    const commands = [];
    for (const category of commandCategories) {
      const commandFiles = getAllFiles(category).filter((file) =>
        file.endsWith(".js"),
      );
      for (const commandFile of commandFiles) {
        const file = (await import(commandFile)).default;
        commands.push(file.data.toJSON());
      }
    }

    const rest = new REST().setToken(String(process.env.DISCORD_TOKEN));

    (async () => {
      try {
        console.log(
          `[LOG]: Discord: Started refreshing ${commands.length} application (/) commands.`,
        );

        const clientId = String(process.env.DISCORD_ID);

        const data = await rest.put(Routes.applicationCommands(clientId), {
          body: commands,
        });

        if (data instanceof Array) {
          console.log(
            `[LOG]: Discord: Successfully reloaded ${data.length} application (/) commands.`,
          );
        } else {
          console.log(
            `[LOG]: Discord: Successfully reloaded application (/) commands.`,
          );
        }
      } catch (error) {
        console.error(error);
      }
    })();
  },
};
