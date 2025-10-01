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

        const scoreSaberId = interaction.options.getString('scoresaberid')?.replace(/[^0-9]/g, '');
        
        const getBeatLeader = async () => {

            try {

                const response = await fetch(`https://api.beatleader.com/player/discord/${interaction.user.id}`, {})
                return response.json();

            } catch (error) {

                console.error('Error fetching BeatLeader data:', error);
                await interaction.reply({ content: 'There was an error attempting to fetch BeatLeader data. Please try again later.', ephemeral: true });
                return;
            }
        }

        const getScoreSaber = async (id: string) => {

            try {

                const response = await fetch(`https://scoresaber.com/api/player/${id}/basic`);
                return response.json();


            } catch (error) {

                await interaction.reply({ content: 'Invalid ScoreSaber ID', ephemeral: true });
                return; 

            }
        }

        const beatLeaderData: any = await getBeatLeader();

        const player = await Player.findOne({ discordId: interaction.user.id });

        if (player) {

            if (beatLeaderData && beatLeaderData.id === player.beatLeaderId) {

                if (scoreSaberId && scoreSaberId !== player.scoreSaberId) {

                    const scoreSaberProfile: any = await getScoreSaber(scoreSaberId);

                    if (scoreSaberProfile && scoreSaberProfile.id === scoreSaberId) {

                        player.scoreSaberId = scoreSaberId;
                        await player.save();
                        return await interaction.reply({ content: 'Your ScoreSaber ID has been updated successfully!', ephemeral: true });
                        
                    }

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
                discordId: interaction.user.id,
                beatLeaderId: beatLeaderData.id,
                scoreSaberId: scoreSaberId || undefined,
                scoreIds: []
            });

            await newPlayer.save();
            await interaction.reply({ content: 'Account(s) linked successfully!', ephemeral: true });

        }
        
    }
}