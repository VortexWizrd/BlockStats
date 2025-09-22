import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Player from '../../models/Player';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Connect your BeatLeader/ScoreSaber account (you must link your Discord on your BeatLeader profile)')
        .addStringOption(option => 
            option.setName('scoresaberid')
                .setDescription('Your ScoreSaber ID (optional)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        const scoreSaberId = interaction.options.getString('scoresaberid');
        
        const getBeatLeader = async () => {
            try {
                const response = await fetch(`https://api.beatleader.com/player/discord/${interaction.user.id}`, {})
                return response.json();
            } catch (error) {
                console.error('Error fetching BeatLeader data:', error);
                return await interaction.reply({ content: 'There was an error attempting to fetch BeatLeader data. Please try again later.', ephemeral: true });
            }
        }
        const beatLeaderData: any = await getBeatLeader();

        const authorId = interaction.user.id;

        const query = { discordId: authorId };
        const player = await Player.findOne(query);
        if (player) {
            if (beatLeaderData && beatLeaderData.id === player.beatLeaderId) {
                if (scoreSaberId && scoreSaberId !== player.scoreSaberId) {
                    player.scoreSaberId = scoreSaberId;
                    await player.save();
                    return await interaction.reply({ content: 'Your ScoreSaber ID has been updated successfully!', ephemeral: true });
                } else {
                    return await interaction.reply({ content: 'Your BeatLeader account is already linked!', ephemeral: true });
                }
            } else {
                player.beatLeaderId = beatLeaderData.id;
                await player.save();
                await interaction.reply({ content: 'Your BeatLeader account has been updated successfully!', ephemeral: true });
            }
        } else {
            const newPlayer = new Player({
                discordId: authorId,
                beatLeaderId: beatLeaderData.id,
                scoreSaberId: scoreSaberId || undefined,
                scoreIds: []
            });
            await newPlayer.save();
            await interaction.reply({ content: 'Account(s) linked successfully!', ephemeral: true });
        }
        
    }
}