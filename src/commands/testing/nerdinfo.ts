import {
    CommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";
import BeatLeaderAPI from "../../api/BeatLeaderAPI";
import ScoreSaberAPI from "../../api/ScoreSaberAPI";

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
                    name: "Latest BL Socket Update",
                    value: BeatLeaderAPI.lastSocketUpdate.toUTCString(),
                },
                {
                    name: "Latest SS Socket Update",
                    value: ScoreSaberAPI.lastSocketUpdate.toUTCString(),
                },
            ]);
        await interaction.reply({ embeds: [embed] });
    },
};
