import { ActionRowBuilder, ButtonInteraction, Events, ButtonBuilder, ButtonStyle } from 'discord.js';
import Player from '../../models/Player';
import Score from '../../models/Score';
require('dotenv').config();

module.exports = {
    data: {
        type: Events.InteractionCreate,
        once: false,
    },
    async execute(interaction: ButtonInteraction): Promise<void> {
        if (!interaction.isButton()) return;

        const player = await Player.findOne({discordId: interaction.user.id});
        if (!player) {
            await interaction.reply({content: "Link your BeatLeader profile using /link to vote on scores!", ephemeral: true});
            return;
        }
        const score = await Score.findOne({messages: {$elemMatch: {messageId: interaction.message.id}}});
        if (!score) return;

        switch (interaction.customId) {

            case "score-like": {

                if (score.downVoteIds.includes(player.beatLeaderId)) {
                    score.downVoteIds = score.downVoteIds.filter(id => id != player.beatLeaderId);
                }
                if (score.upVoteIds.includes(player.beatLeaderId)) {
                    score.upVoteIds = score.upVoteIds.filter(id => id != player.beatLeaderId);
                    await interaction.reply({content: "Removed like!", ephemeral: true});
                } else {
                    score.upVoteIds.push(player.beatLeaderId);
                    await interaction.reply({content: "Liked score!", ephemeral: true});
                }
                score.save().catch(err => console.log(err));
                break;
            }
            case "score-dislike": {

                if (score.upVoteIds.includes(player.beatLeaderId)) {
                    score.upVoteIds = score.upVoteIds.filter(id => id != player.beatLeaderId);
                }
                if (score.downVoteIds.includes(player.beatLeaderId)) {
                    score.downVoteIds = score.downVoteIds.filter(id => id != player.beatLeaderId);
                    await interaction.reply({content: "Removed dislike!", ephemeral: true});
                } else {
                    score.downVoteIds.push(player.beatLeaderId);
                    await interaction.reply({content: "Disliked score!", ephemeral: true});
                }
                score.save().catch(err => console.log(err));
                break;
            }

        }

        // refresh button labels
        for (const messageData of score.messages) {

            const guild = interaction.client.guilds.cache.get(messageData.guildId || "");
            if (guild) {
                const channel = guild?.channels.cache.get(messageData.channelId || "");
                if (channel && channel.isTextBased()) {
                    const message = await channel?.messages.fetch(messageData.messageId);
                    if (message) {
                        const like = new ButtonBuilder()
                            .setCustomId('score-like')
                            .setLabel('👍 Like • ' + score.upVoteIds.length)
                            .setStyle(ButtonStyle.Success);
                    
                        const dislike = new ButtonBuilder()
                            .setCustomId('score-dislike')
                            .setLabel('👎 Dislike • ' + score.downVoteIds.length)
                            .setStyle(ButtonStyle.Danger);
        
                        const row = new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(like, dislike);
        
                        await message.edit({components: [row]});
                    }
                }
            } else {
                const user = await interaction.client.users.fetch(messageData.userId || "");
                if (user) {
                    const dmChannel = await user.createDM();
                    const message = await dmChannel?.messages.fetch(messageData.messageId);
                    if (message) {
                        const like = new ButtonBuilder()
                            .setCustomId('score-like')
                            .setLabel('👍 Like • ' + score.upVoteIds.length)
                            .setStyle(ButtonStyle.Success);
                
                        const dislike = new ButtonBuilder()
                            .setCustomId('score-dislike')
                            .setLabel('👎 Dislike • ' + score.downVoteIds.length)
                            .setStyle(ButtonStyle.Danger);
    
                        const row = new ActionRowBuilder<ButtonBuilder>()
                        .   addComponents(like, dislike);
    
                        await message.edit({components: [row]});
                    }

                    
    
                } else {
                    score.messages.filter((item) => item !== messageData);
                    score.save().catch(err => console.log(err));
                    return;
                }
            }

            
        }
        
    }
}