import {
    CommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";
import BeatLeaderAPI from "../../api/BeatLeaderAPI";
import ScoreSaberAPI from "../../api/ScoreSaberAPI";
import Player from "../../models/Player";
import Score from "../../models/Score";
import ScoreFeed from "../../models/ScoreFeed";
import { trusted } from "mongoose";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nerdinfo")
        .setDescription("Get debugging information"),
    async execute(interaction: CommandInteraction) {
        const embed = new EmbedBuilder()
            .setTitle("Debug Info")
            .setColor(0x00aaff)
            .addFields([
                {
                    name: "Accounts",
                    value: (await Player.countDocuments()).toString(),
                    inline: true,
                },
                {
                    name: "Scores",
                    value: (await Score.countDocuments()).toString(),
                    inline: true,
                },
                {
                    name: "Score Feeds",
                    value: (await ScoreFeed.countDocuments()).toString(),
                },
                {
                    name: "Latest BL Socket Update",
                    value: BeatLeaderAPI.lastSocketUpdate.toUTCString(),
                },
                {
                    name: "Latest SS Socket Update",
                    value: ScoreSaberAPI.lastSocketUpdate.toUTCString(),
                    inline: true,
                },
            ]);
        await interaction.reply({ embeds: [embed] });
    },
};
