import { Client, Embed, EmbedBuilder, Events, TextChannel } from 'discord.js';
import ScoreFeed from '../../models/ScoreFeed';

module.exports = {
    data: {
        type: Events.ClientReady,
        once: false,
    },
    execute(client: Client): void {

        const socket = new WebSocket('wss://sockets.api.beatleader.com/scores');

        socket.addEventListener('message', async message => {
            const scoreData = JSON.parse(message.data);

            const query = {
                beatleaderIds: { $in: [scoreData.playerId] }
            }

            try {
                const scoreFeeds = await ScoreFeed.find(query);
                for (const feed of scoreFeeds) {
                    const channel = await client.channels.fetch(feed.channelId);
                    if (channel instanceof TextChannel) {
                        let difficultyName = scoreData.leaderboard.difficulty.difficultyName;
                        if (difficultyName === 'ExpertPlus') {
                            difficultyName = 'Expert+';
                        }
                        if (scoreData.leaderboard.difficulty.modeName !== 'Standard') {
                            difficultyName += ` ${scoreData.leaderboard.difficulty.modeName}`;
                        }
                        if (scoreData.leaderboard.difficulty.stars !== null) {
                            difficultyName += ` • ${(Math.round(scoreData.leaderboard.difficulty.stars * 100) / 100)}★`;
                        }

                        let color = 0x3e3e3e;
                        if (scoreData.contextExtensions[0].accuracy >= 0.95) {
                            color = 0x8f48db;
                        } else if (scoreData.contextExtensions[0].accuracy >= 0.90) {
                            color = 0xbf2a42;
                        } else if (scoreData.contextExtensions[0].accuracy >= 0.85) {
                            color = 0xff6347;
                        } else if (scoreData.contextExtensions[0].accuracy >= 0.80) {
                            color = 0x59b0f4;
                        } else if (scoreData.contextExtensions[0].accuracy >= 0.70) {
                            color = 0x3cb371;
                        }

                        let fc;
                        let missName;
                        let missValue;
                        let modifiersName;
                        let modifiersValue;

                        if (scoreData.fullCombo) {
                            fc = ":white_check_mark:";
                        } else {
                            fc = ":x:";
                            missName = "Misses";
                            missValue = scoreData.badCuts + scoreData.missedNotes;
                        }

                        if (scoreData.contextExtensions[0].modifiers) {
                            modifiersName = "Modifiers";
                            modifiersValue = scoreData.contextExtensions[0].modifiers;
                        }
                        

                        let info = "\u200B#" + scoreData.contextExtensions[0].rank + " • " + (Math.round(scoreData.contextExtensions[0].accuracy * 10000) / 100) + "%";
                        if (scoreData.contextExtensions[0].pp > 0) {
                            info += " • " + (Math.round(scoreData.contextExtensions[0].pp * 100) / 100) + "pp";
                        }

                        const embed = new EmbedBuilder()
                            .setAuthor({
                                name: scoreData.player.name,
                                iconURL: scoreData.player.avatar,
                                url: 'https://beatleader.com/u/' + scoreData.player.id
                            })
                            .setTitle(`New score on **${scoreData.leaderboard.song.name} [${difficultyName}]**`)
                            .setURL("https://replay.beatleader.com/?link=" + scoreData.replay)
                            .setColor(color)
                            .setThumbnail(scoreData.leaderboard.song.coverImage)
                            .setDescription(`# ${info}`)
                            .addFields(
                                { name: 'Full Combo', value: fc, inline: true },
                                { name: missName ?? '\u200B', value: missValue?.toString() ?? '\u200B', inline: true },
                                { name: modifiersName ?? '\u200B', value: modifiersValue ?? '\u200B', inline: true },
                            )
                            .setTimestamp()

                        channel.send({ embeds: [embed] });
                    }
                }
            } catch (error) {
                console.error('Error fetching score feeds:', error);
            }
        });
    }
}