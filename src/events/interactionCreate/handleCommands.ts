import { Client, CommandInteraction, Events, Interaction } from 'discord.js';
require('dotenv').config();
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = {
    data: {
        type: Events.InteractionCreate,
        once: false,
    },
    async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const localCommands = getLocalCommands();

        try {
            const commandObject = localCommands.find((cmd: any) => cmd.data.name === interaction.commandName);

            if (!commandObject) return;

            await commandObject.execute(interaction);


        } catch (error) {
            console.error('Error executing command:', error);
        }
    }
}