import { CommandInteraction, Events } from "discord.js";
import getAllFiles from "../../utils/getAllFiles.js";
import path from "path";

export default {
  data: {
    type: Events.InteractionCreate,
    once: false,
  },
  async execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const commandCategories = getAllFiles(
      path.join(import.meta.dirname, "../../commands"),
      true,
    );
    const commands = [];
    for (const category of commandCategories) {
      const commandFiles = getAllFiles(category).filter((file) =>
        file.endsWith(".js"),
      );
      for (const file of commandFiles) {
        const fileImport = await import(file);
        commands.push(fileImport.default);
      }
    }

    try {
      const commandObject = commands.find(
        (cmd: any) => cmd.data.name === interaction.commandName,
      );

      if (!commandObject) return;

      await commandObject.execute(interaction);
    } catch (error) {
      console.error("Error executing command:", error);
    }
  },
};
