import {
  CommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Returns client ping"),
  async execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("🏓 Ping")
      .setColor(0xff0000)
      .setDescription(
        `Pong! Client ping is **${interaction.client.ws.ping}ms**`,
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
