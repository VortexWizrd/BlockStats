import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Returns client ping'),
    async execute(interaction: CommandInteraction) {
        const embed = new EmbedBuilder()
        .setTitle('🏓 Ping')
        .setColor(0xFF0000)
        .setDescription(`Pong! Client ping is **${interaction.client.ws.ping}ms**`);
        await interaction.reply({ embeds: [embed] });
    }
    
}