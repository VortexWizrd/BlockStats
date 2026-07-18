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
import { PlayersRepository } from "../../../repositories/players/players.repository.js";
import { PlayerRankHistoriesRepository } from "../../../repositories/players/playerrankhistories.repository.js";
import type Player from "../../../common/player.js";
import { ScoreService } from "../../../service/score.service.js";
import { link } from "node:fs";
import { MapService } from "../../../service/map.service.js";
import Map from "../../../common/map/map.js";

export default {
  data: new SlashCommandBuilder()
    .setName("map")
    .setDescription("Display/manage maps")
    .addSubcommand((cmd) =>
      cmd
        .setName("show")
        .setDescription("Display map information")
        .addStringOption((option) =>
          option
            .setName("beatsaverid")
            .setDescription("Map BeatSaver ID")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("title")
            .setDescription("Search by song title")
            .setRequired(false),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "show": {
        await interaction.deferReply();

        let maps: Map[] = [];

        const beatsaverId = interaction.options.getString("beatsaverid");
        if (beatsaverId) {
          maps = maps.concat(
            (await MapService.getMapFromBeatSaverId(beatsaverId)) ?? [],
          );
        } else {
          const search = interaction.options.getString("title");
          if (!search)
            return await interaction.editReply("Missing search parameter");
          return await interaction.editReply("Not implemented");
        }

        let embeds = [];
        for (const map of maps) {
          embeds.push(
            new EmbedBuilder()
              .setTitle(
                `${map.songAuthor ? map.songAuthor + " - " : ""}${map.songName} ${map.songSubName}`,
              )
              .setDescription(
                map.mapAuthor ? `Mapped by ${map.mapAuthor}` : null,
              )
              .setURL(
                map.beatSaverId
                  ? `https://beatsaver.com/maps/${map.beatSaverId}`
                  : null,
              )
              .setColor("Blue")
              .setThumbnail(map.songCover),
          );
        }

        if (embeds.length == 0) {
          return await interaction.editReply("No maps found");
        }

        await interaction.editReply({ embeds: embeds });
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
