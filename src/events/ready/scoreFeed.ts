import { Client, Embed, EmbedBuilder, Events, SortOrderType, TextChannel } from 'discord.js';
import ScoreFeed from '../../models/ScoreFeed';
import Score from '../../models/Score';
import Player from '../../models/Player';

async function outputScore(client: Client, score: any): Promise<void> {

    
    const query = {
        beatleaderIds: { $in: [score.beatLeaderData.player.id] }
    }

    try {
        const scoreFeeds = await ScoreFeed.find(query);
        for (const feed of scoreFeeds) {

            const player = await Player.findOne({discordId: score.discordId});
            if (!player) return;

            const channel = await client.channels.fetch(feed.channelId);
            if (channel instanceof TextChannel) {

                let difficultyName = score.beatLeaderData.leaderboard.difficulty.difficultyName;
                if (difficultyName === 'ExpertPlus') {
                            difficultyName = 'Expert+';
                }
                if (score.beatLeaderData.leaderboard.difficulty.modeName !== 'Standard') {
                            difficultyName += ` ${score.beatLeaderData.leaderboard.difficulty.modeName}`;
                }
                if (score.scoreSaberData) {
                    if (score.scoreSaberData.leaderboard.ranked || score.scoreSaberData.leaderboard.qualified) {
                        difficultyName += ` | ${(Math.round(score.scoreSaberData.leaderboard.stars * 100) / 100)}★ SS`;
                    }
                }
                if (score.beatLeaderData.leaderboard.difficulty.stars !== null) {
                    difficultyName += ` | ${(Math.round(score.beatLeaderData.leaderboard.difficulty.stars * 100) / 100)}★ BL`;
                } 

                let color = 0x3e3e3e;
                if (score.beatLeaderData.contextExtensions[0].accuracy >= 0.95) {
                    color = 0x8f48db;
                } else if (score.beatLeaderData.contextExtensions[0].accuracy >= 0.90) {
                    color = 0xbf2a42;
                } else if (score.beatLeaderData.contextExtensions[0].accuracy >= 0.85) {
                    color = 0xff6347;
                } else if (score.beatLeaderData.contextExtensions[0].accuracy >= 0.80) {
                    color = 0x59b0f4;
                } else if (score.beatLeaderData.contextExtensions[0].accuracy >= 0.70) {
                    color = 0x3cb371;
                }

                let modifiersName;
                let modifiersValue;

                let info = "\u200B#" + score.beatLeaderData.contextExtensions[0].rank + " • " + (Math.round(score.beatLeaderData.contextExtensions[0].accuracy * 10000) / 100) + "%";
                
                if (score.beatLeaderData.fullCombo) {
                    info += " • " + "FC"
                } else {
                    const missValue = score.beatLeaderData.badCuts + score.beatLeaderData.missedNotes;
                    let missText = " Miss";
                    if (missValue > 1)  {
                        missText = " Misses";
                    }
                    info += " • " + score.beatLeaderData.badCuts + score.beatLeaderData.missedNotes + missText;
                }

                if (score.beatLeaderData.contextExtensions[0].modifiers) {
                    modifiersName = "Modifiers";
                    modifiersValue = score.beatLeaderData.contextExtensions[0].modifiers;
                }     

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: score.beatLeaderData.player.name,
                        iconURL: score.beatLeaderData.player.avatar,
                        url: 'https://beatleader.com/u/' + score.beatLeaderData.player.id
                    })
                    .setTitle(`New score on **${score.beatLeaderData.leaderboard.song.name} [${difficultyName}]**`)
                    .setURL("https://replay.beatleader.com/?link=" + score.beatLeaderData.replay)
                    .setColor(color)
                    .setThumbnail(score.beatLeaderData.leaderboard.song.coverImage)
                    .setDescription(`# ${info}`)
                    .setTimestamp()

                if (score.beatLeaderData.contextExtensions[0].pp > 0) {
                    embed.addFields(
                        { name: "BeatLeader pp", value: Math.round(score.beatLeaderData.contextExtensions[0].pp * 100) / 100 + "pp", inline: true})
                }

                if (score.scoreSaberData) {
                    if (score.scoreSaberData.score.pp > 0) {
                        embed.addFields(
                            { name: "ScoreSaber pp", value: Math.round(score.scoreSaberData.score.pp * 100) / 100 + "pp", inline: true})
                    }
                }

                if (score.beatLeaderData.contextExtensions[0].modifiers) {
                    embed.addFields(
                        { name: "Modifiers", value: score.beatLeaderData.contextExtensions[0].modifiers, inline: true})
                } 

                const message = channel.send({ embeds: [embed] });

                (await message).id
            }
        }
    } catch (error) {
        console.error('Error fetching score feeds:', error);
    }
}

module.exports = {
    data: {
        type: Events.ClientReady,
        once: false,
    },
    execute(client: Client): void {

        const blSocket = new WebSocket('wss://sockets.api.beatleader.com/scores');
        const ssSocket = new WebSocket('wss://scoresaber.com/ws');

        blSocket.addEventListener('message', async message => {
            const scoreData = JSON.parse(message.data);

            const player = await Player.findOne({
                beatLeaderId: scoreData.player.id
            })

            if (!player) return;

            if (player.scoreSaberId) {
                
                const score = await Score.findOne({
                    discordId: player.discordId,
                    beatLeaderData: { $in: [undefined, null] }
                });

                if (score) {
                    score.beatLeaderData = scoreData;
                    score.save().catch(err => console.log(err));

                    await outputScore(client, score);
                } else {
                    const newScore = new Score({
                        discordId: player.discordId,
                        beatLeaderData: scoreData
                    });
                    newScore.save().catch(err => console.log(err));
                }
            } else {
                const newScore = new Score({
                    discordId: player.discordId,
                    beatLeaderData: scoreData
                });
                newScore.save().catch(err => console.log(err));
                
                await outputScore(client, newScore);
            }

        });

        ssSocket.addEventListener('message', async (message: any) => {
            if (message.data == 'Connected to the ScoreSaber WSS') {
                return;
            }

            const messageData = JSON.parse(message.data);

            if (messageData.commandName !== 'score') return;

            const scoreData = messageData.commandData;

            const player = await Player.findOne({
                scoreSaberId: scoreData.score.leaderboardPlayerInfo.id
            })

            if (!player) return;

            const score = await Score.findOne({
                discordId: player.discordId,
                scoreSaberData: { $in: [undefined, null] }
                });

                if (score) {
                    score.scoreSaberData = scoreData;
                    score.save().catch(err => console.log(err));

                    if (score.beatLeaderData) {
                        await outputScore(client, score);
                    }
                } else {
                    const newScore = new Score({
                        discordId: player.discordId,
                        beatLeaderData: scoreData
                    });
                    newScore.save().catch(err => console.log(err));
                }

        })


        
    }
}