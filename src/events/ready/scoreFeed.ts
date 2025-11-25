import { Client, Events, MessageCreateOptions, TextChannel } from "discord.js";
import ScoreFeed from "../../models/ScoreFeed";
import Score from "../../models/Score";
import Player from "../../models/Player";
import ReconnectingWebSocket from "reconnecting-websocket";
import ScoreDisplay from "../../utils/getScoreDisplay";

async function outputScore(client: Client, score: any): Promise<void> {
    try {
        const scoreDisplay = new ScoreDisplay(score);
        let messageData: MessageCreateOptions;

        const player = await Player.findOne({ discordId: score.discordId });
        if (player) {
            messageData = {
                embeds: [scoreDisplay.getEmbed()],
                components: [scoreDisplay.getButtons()],
            };
        } else {
            messageData = {
                embeds: [scoreDisplay.getEmbed()],
            };
            ScoreFeed.deleteOne(score);
        }

        const scoreFeeds = await ScoreFeed.find({
            beatleaderIds: { $in: [score.beatLeaderData.playerId] },
        });

        for (const feed of scoreFeeds) {
            console.log(feed);

            if (feed.channelId && feed.guildId) {
                const channel = await client.channels.fetch(
                    feed.channelId || ""
                );
                if (channel && channel instanceof TextChannel) {
                    const message = await channel.send(messageData);

                    score.messages.push({
                        messageId: message.id,
                        channelId: message.channel.id,
                        guildId: message.guild.id,
                    });

                    score.save().catch((err: any) => console.log(err));
                }
            } else if (feed.userId) {
                const user = await client.users.fetch(feed.userId || "");
                console.log(user);

                if (user) {
                    const message = await user.send(messageData);

                    score.messages.push({
                        messageId: message.id,
                        userId: feed.userId,
                    });

                    score.save().catch((err: any) => console.log(err));
                }
            }
        }
        console.log(
            `[${new Date().toLocaleTimeString()}] New score by ${
                score.beatLeaderData.player.name
            }`
        );
    } catch (error) {
        console.error("Error fetching score feeds:", error);
    }
}

module.exports = {
    data: {
        type: Events.ClientReady,
        once: false,
    },
    execute(client: Client): void {
        let blSocket = new ReconnectingWebSocket(
            "wss://sockets.api.beatleader.com/scores"
        );
        let ssSocket = new ReconnectingWebSocket("wss://scoresaber.com/ws");

        blSocket.addEventListener("message", (message) => {
            (async () => {
                const scoreData = JSON.parse(message.data);

                const player = await Player.findOne({
                    beatLeaderId: scoreData.player.id,
                });

                if (!player) {
                    if (
                        await ScoreFeed.findOne({
                            beatleaderIds: { $in: [scoreData.player.id] },
                        })
                    ) {
                        const newScore = new Score({
                            beatLeaderData: scoreData,
                        });
                        newScore.save().catch((err) => console.log(err));
                        await outputScore(client, newScore);
                    }
                    return;
                }

                if (player.scoreSaberId) {
                    const score = await Score.findOne({
                        discordId: player.discordId,
                        beatLeaderData: { $in: [undefined, null] },
                        "scoreSaberData.leaderboard.songHash":
                            scoreData.leaderboard.song.hash.toUpperCase(),
                        "scoreSaberData.score.baseScore": scoreData.baseScore,
                    });

                    if (score) {
                        score.beatLeaderData = scoreData;
                        score.save().catch((err) => console.log(err));

                        await outputScore(client, score);
                    } else {
                        const newScore = new Score({
                            discordId: player.discordId,
                            beatLeaderData: scoreData,
                        });
                        newScore.save().catch((err) => console.log(err));
                    }
                } else {
                    const newScore = new Score({
                        discordId: player.discordId,
                        beatLeaderData: scoreData,
                    });
                    newScore.save().catch((err) => console.log(err));

                    await outputScore(client, newScore);
                }
            })();
        });

        ssSocket.addEventListener("message", (message) => {
            (async () => {
                if (message.data == "Connected to the ScoreSaber WSS") {
                    return;
                }

                const messageData = JSON.parse(message.data);

                if (messageData.commandName !== "score") return;

                const scoreData = messageData.commandData;

                const player = await Player.findOne({
                    scoreSaberId: scoreData.score.leaderboardPlayerInfo.id,
                });

                if (!player) return;

                const score = await Score.findOne({
                    discordId: player.discordId,
                    "beatLeaderData.leaderboard.song.hash":
                        scoreData.leaderboard.songHash.toLowerCase(),
                    "beatLeaderData.baseScore": scoreData.score.baseScore,
                    scoreSaberData: { $in: [undefined, null] },
                });

                if (score) {
                    score.scoreSaberData = scoreData;
                    score.save().catch((err) => console.log(err));
                    await outputScore(client, score);
                } else {
                    const newScore = new Score({
                        discordId: player.discordId,
                        scoreSaberData: scoreData,
                    });

                    newScore.save().catch((err) => console.log(err));
                }
            })();
        });
    },
};
