import {
  ActionRowBuilder,
  ButtonInteraction,
  Events,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  AttachmentBuilder,
} from "discord.js";
import { PlayerService } from "../../../service/player.service.js";
import { ScoreService } from "../../../service/score.service.js";
import ScoreDisplay from "../../common/ScoreDisplay.js";
import { MapService } from "../../../service/map.service.js";

export default {
  data: {
    type: Events.InteractionCreate,
    once: false,
  },
  async execute(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;
    if (!["map-download-discord"].includes(interaction.customId)) return;

    const embed = interaction.message?.embeds[0];
    if (!embed) return;

    const mapId = parseInt(embed.footer?.text.substring(4) ?? "");
    if (!mapId || isNaN(mapId)) return;

    const mapDownload = await MapService.getMapDownloadLink(mapId);
    if (!mapDownload) return;
    if (mapDownload.includes("https://cdn.discordapp.com/attachments")) {
      return await interaction.reply({
        content: mapDownload,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      return await interaction.reply({
        content: "Failed to get file",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
