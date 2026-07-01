import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import beatleaderApiService from "../../../service/external/beatleader-api.service.js";
import { db } from "../../../db/index.js";
import { playersTable } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { PlayerService } from "../../../service/player.service.js";
import { PlayersRepository } from "../../../repositories/players.repository.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Display/manage BlockStats profiles")
    .addSubcommand((cmd) =>
      cmd
        .setName("link")
        .setDescription(
          "Connect your BeatLeader/ScoreSaber accounts (you must link your Discord on your BeatLeader profile)",
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("unlink")
        .setDescription(
          "Delete your BlockStats profile (WARNING: ALL data not stored on other sites will be deleted!)",
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("show")
        .setDescription("View a BlockStats profile")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to view")
            .setRequired(false),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "link": {
        const beatLeaderData: any =
          await beatleaderApiService.getUserFromDiscord(interaction.user.id);

        if (!beatLeaderData) {
          return await interaction.reply({
            content:
              "Please link your Discord account to your BeatLeader profile by going to https://beatleader.com/signin/socials",
            flags: MessageFlags.Ephemeral,
          });
        }

        const player = await PlayersRepository.findById(interaction.user.id);

        if (!player) {
          await PlayerService.createPlayer(interaction.user.id);

          return await interaction.reply({
            content: "Profile created successfully!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          return await interaction.reply({
            content: "Profile updated successfully!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      case "unlink": {
        try {
          await db
            .delete(playersTable)
            .where(eq(playersTable.id, interaction.user.id));
          return await interaction.reply("Successfully deleted profile");
        } catch (err) {
          console.log("Error deleting BlockStats profile: ", err);
        }
      }

      case "show": {
        await interaction.deferReply();

        const userId =
          interaction.options.getUser("user")?.id ?? interaction.user.id;
        const player = await PlayerService.getPlayer(userId);

        if (!player) {
          return await interaction.editReply("Profile not found");
        }

        const linkText = `[[ <:beatleader:1492695343345832102> BeatLeader ](https://beatleader.com/u/${player.alias ?? player.steamId ?? player.oculusId ?? player.questId}) | [ <:discord:1492695870343221323> Discord ](https://discord.com/users/${player.id})${player.scoreSaberId ? ` | [ <:scoresaber:1492695389634035823> ScoreSaber ](https://scoresaber.com/u/${player.scoreSaberId})` : ""}]`;

        const embed = new EmbedBuilder()
          .setTitle(player.name)
          .setThumbnail(player.avatar)
          .setColor("Default")
          .setDescription(
            `${linkText}\n# ${player.ssRankHistory[player.ssRankHistory.length - 1] ? `<:scoresaber:1492695389634035823> #${player.ssRankHistory[player.ssRankHistory.length - 1]?.rank} • ` : ""}${player.blRankHistory[player.blRankHistory.length - 1] ? `<:beatleader:1492695343345832102> #${player.blRankHistory[player.blRankHistory.length - 1]?.rank}` : ""}`,
          );

        console.log(player);

        return interaction.editReply({
          embeds: [embed],
        });
      }
    }
  },
};

function getIds(beatLeaderData: any): Promise<Object> {
  const linkedIds = beatLeaderData.linkedIds;
  if (beatLeaderData.alias) {
    linkedIds["alias"] = beatLeaderData.alias;
  }
  return linkedIds;
}
