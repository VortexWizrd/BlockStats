import { Client, Events, TextChannel } from "discord.js";
import Player from "../../models/Player";
import BeatLeaderAPI from "../../api/BeatLeaderAPI";
import RankFeed from "../../models/RankFeed";
import ScoreSaberAPI from "../../api/ScoreSaberAPI";
import RankDisplay from "../../utils/getRankDisplay";

module.exports = {
    data: {
        type: Events.ClientReady,
        once: false,
    },
    execute(client: Client): void {
        // BeatLeader rank changes
        BeatLeaderAPI.addListener("score", async (message) => {
            const scoreData = message;

            // Only update if criteria met
            if (scoreData.leaderboard.difficulty.status !== 3) {
                return;
            }

            // Update all BeatLeader ranks
            const players = await Player.find();
            for (const player of players) {
                try {
                    const blPlayerData = await BeatLeaderAPI.getUserFromDiscord(
                        player.discordId,
                    );
                    if (!blPlayerData) {
                        continue;
                    }
                    if (
                        Number.isNaN(blPlayerData.rank) ||
                        !blPlayerData.rank ||
                        blPlayerData.rank <= 0
                    ) {
                        continue;
                    }
                    if (player.blRankHistory.length == 0) {
                        player.blRankHistory.push({
                            timestamp: Date.now(),
                            rank: blPlayerData.rank,
                        });
                        await player.save().catch((e) => console.log(e));
                        continue;
                    }
                    if (
                        player.blRankHistory[player.blRankHistory.length - 1]
                            .rank == blPlayerData.rank
                    ) {
                        continue;
                    }
                    player.blRankHistory.push({
                        timestamp: Date.now(),
                        rank: blPlayerData.rank,
                    });
                    await player.save().catch((e) => console.log(e));

                    console.log(
                        `[${new Date().toLocaleTimeString()}] Updated BeatLeader rank for ${
                            blPlayerData.name
                        }`,
                    );

                    const embed = new RankDisplay(
                        blPlayerData,
                        0,
                        player.blRankHistory[player.blRankHistory.length - 2]
                            .rank,
                        player.blRankHistory[player.blRankHistory.length - 1]
                            .rank,
                    ).getEmbed();

                    const rankFeeds = await RankFeed.find({
                        beatleaderIds: { $in: [player.beatLeaderId] },
                    });
                    for (const feed of rankFeeds) {
                        if (feed.channelId && feed.guildId) {
                            const channel = await client.channels.fetch(
                                feed.channelId || "",
                            );
                            if (channel && channel instanceof TextChannel) {
                                const message = await channel.send({
                                    embeds: [embed],
                                });
                            }
                        } else if (feed.userId) {
                            const user = await client.users.fetch(
                                feed.userId || "",
                            );
                            if (user) {
                                const message = await user.send({
                                    embeds: [embed],
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        });

        // ScoreSaber rank changes
        ScoreSaberAPI.addListener("score", async (message) => {
            const scoreData = message;

            // Only update if criteria met
            if (scoreData.pp <= 0) {
                return;
            }

            // Update all ScoreSaber ranks
            const players = await Player.find();
            for (const player of players) {
                if (player.scoreSaberId) {
                    try {
                        const blPlayerData =
                            await BeatLeaderAPI.getUserFromDiscord(
                                player.discordId,
                            );
                        const ssPlayerData = await ScoreSaberAPI.getUserFromId(
                            player.scoreSaberId,
                        );
                        if (!ssPlayerData || !blPlayerData) {
                            continue;
                        }
                        if (
                            Number.isNaN(ssPlayerData.rank) ||
                            !ssPlayerData.rank ||
                            ssPlayerData.rank <= 0
                        ) {
                            continue;
                        }
                        if (player.ssRankHistory.length == 0) {
                            player.ssRankHistory.push({
                                timestamp: Date.now(),
                                rank: ssPlayerData.rank,
                            });
                            await player.save().catch((e) => console.log(e));
                            continue;
                        }
                        if (
                            player.ssRankHistory[
                                player.ssRankHistory.length - 1
                            ].rank == ssPlayerData.rank
                        ) {
                            continue;
                        }

                        player.ssRankHistory.push({
                            timestamp: Date.now(),
                            rank: ssPlayerData.rank,
                        });
                        await player.save().catch((e) => console.log(e));

                        console.log(
                            `[${new Date().toLocaleTimeString()}] Updated ScoreSaber rank for ${
                                blPlayerData.name
                            }`,
                        );

                        const embed = new RankDisplay(
                            blPlayerData,
                            0,
                            player.ssRankHistory[
                                player.ssRankHistory.length - 2
                            ].rank,
                            player.ssRankHistory[
                                player.ssRankHistory.length - 1
                            ].rank,
                        ).getEmbed();

                        const rankFeeds = await RankFeed.find({
                            beatleaderIds: { $in: [player.beatLeaderId] },
                        });
                        for (const feed of rankFeeds) {
                            if (feed.channelId && feed.guildId) {
                                const channel = await client.channels.fetch(
                                    feed.channelId || "",
                                );
                                if (channel && channel instanceof TextChannel) {
                                    const message = await channel.send({
                                        embeds: [embed],
                                    });
                                }
                            } else if (feed.userId) {
                                const user = await client.users.fetch(
                                    feed.userId || "",
                                );
                                if (user) {
                                    const message = await user.send({
                                        embeds: [embed],
                                    });
                                }
                            }
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
        });
    },
};
