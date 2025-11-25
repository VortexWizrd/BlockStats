import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Score from "../../models/Score";
import ScoreDisplay from "../../utils/getScoreDisplay";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("displayscore")
        .setDescription("Display a score using its id")
        .addStringOption((option) =>
            option.setName("id").setDescription("Score ID").setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("display_type")
                .setDescription("Select how you want scores to be displayed")
                .setRequired(true)
                .addChoices({ name: "embed", value: "embed" })
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const id = interaction.options.getString("id");

        if (!interaction.guild) {
            await interaction.reply({
                content: "You must be in a server to use this command!",
                ephemeral: true,
            });
            return;
        }

        if (!interaction.channel) return;
        if (!interaction.channel.isTextBased()) return;

        const score = await Score.findOne({
            _id: id,
        });

        if (score) {
            await interaction.deferReply({ ephemeral: true });

            const scoreDisplay = new ScoreDisplay(score);

            const message = await (interaction.channel as any).send({
                embeds: [scoreDisplay.getEmbed()],
                components: [scoreDisplay.getButtons()],
            });

            score.messages.push({
                messageId: message.id,
                channelId: message.channel.id,
                guildId: message.guild.id,
            });
            score.save().catch((err: any) => console.log(err));

            await interaction.editReply({ content: "Fetched score!" });
        } else {
            await interaction.editReply({ content: "Score not found" });
        }
    },
};
