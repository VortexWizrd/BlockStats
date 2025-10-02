import { CommandInteraction, Events } from 'discord.js';
import getAllFiles from '../../utils/getAllFiles';
import path from 'path';
require('dotenv').config();

module.exports = {
    data: {
        type: Events.InteractionCreate,
        once: false,
    },
    async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const commandCategories = getAllFiles(path.join(__dirname, '../../commands'), true);
        const commands = [];
        for (const category of commandCategories) {
            const commandFiles = getAllFiles(category);
            for (const file of commandFiles) {
                commands.push(require(file));
            }
        }

        try {
            const commandObject = commands.find((cmd: any) => cmd.data.name === interaction.commandName);

            if (!commandObject) return;

            await commandObject.execute(interaction);


        } catch (error) {
            console.error('Error executing command:', error);
        }
    }
}