import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import type Score from "../../common/score.js";

const colorPairs = [
  { threshold: 0.95, value: 0x8f48db },
  { threshold: 0.9, value: 0xbf2a42 },
  { threshold: 0.85, value: 0xff6347 },
  { threshold: 0.8, value: 0x59b0f4 },
  { threshold: 0.7, value: 0x3cb371 },
  { threshold: 0, value: 0x3e3e3e },
];

export default class SnipeDisplay {
  public static async getEmbed(
    score: Score,
    snipedScore: Score,
  ): Promise<EmbedBuilder | undefined> {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: score.playerName,
        iconURL: score.playerAvatar,
      })
      .setTitle(
        `Sniped **${snipedScore.playerName}** on **${score.songName}** [${score.songCharacteristic === "Standard" ? "" : score.songCharacteristic + " "}${score.songDifficulty}]`,
      )
      .setURL(
        score.blScoreId
          ? `https://beatleader.com/score/${score.blScoreId}`
          : `https://watch.scoresaber.com/?ssScoreId=${score.ssScoreId}`,
      )
      .setThumbnail(score.songCover)
      .setDescription(
        `# \u200B${
          score.blRank && score.blRank >= 1
            ? `#${score.blRank} • `
            : score.ssRank && score.ssRank >= 1
              ? `#${score.ssRank} • `
              : ""
        }${(score.accuracy * 100).toFixed(2)}% • ${
          score.fullCombo
            ? "FC"
            : `${score.missedNotes + score.badCuts} ` +
              `${score.missedNotes + score.badCuts === 1 ? "Miss" : "Misses"}`
        }\n### \u200B${
          snipedScore.blRank && snipedScore.blRank >= 1
            ? `#${snipedScore.blRank} • `
            : snipedScore.ssRank && snipedScore.ssRank >= 1
              ? `#${snipedScore.ssRank} • `
              : ""
        }${(snipedScore.accuracy * 100).toFixed(2)}% • ${
          snipedScore.fullCombo
            ? "FC"
            : `${snipedScore.missedNotes + snipedScore.badCuts} ` +
              `${snipedScore.missedNotes + snipedScore.badCuts === 1 ? "Miss" : "Misses"}`
        }`,
      )
      .setColor(this.getAccuracyColor(score.accuracy))
      .setTimestamp();

    if (score.ssStarRating) {
      embed.addFields({
        name:
          "<:scoresaber:1492695389634035823> " +
          (score.ppSS ?? 0).toFixed(2) +
          "pp" +
          (score.provider.includes("ScoreSaber") ? "" : "*") +
          ` [${score.ssStarRating.toFixed(2)}★]   `,
        value: " ",
        inline: true,
      });
    }

    if (score.blStarRating) {
      embed.addFields({
        name:
          "<:beatleader:1492695343345832102> " +
          (score.ppBL ?? 0).toFixed(2) +
          "pp" +
          ` [${score.blStarRating.toFixed(2)}★]   `,
        value: "",
        inline: true,
      });
    }

    if (score.ap) {
      embed.addFields({
        name: "<:accsaber:1511190711431593994> " + score.ap.toFixed(2) + "ap",
        value: " ",
        inline: true,
      });
    }

    if (score.modifiers && score.modifiers.length != 0) {
      embed.addFields({
        name: score.modifiers.join(" "),
        value: " ",
        inline: true,
      });
    }

    return embed;
  }

  public static getAccuracyColor(accuracy: number) {
    for (const colorPair of colorPairs) {
      if (accuracy >= colorPair.threshold) {
        return colorPair.value;
      }
    }
    console.warn(
      "getAccuracyColor: no color pairs defined, defaulting to 0x000000",
    );
    return 0x000000;
  }
}
