import { EmbedBuilder } from "discord.js";

export default class RankDisplay {
  private static rankDifference(oldRank: number, newRank: number) {
    return Math.abs(oldRank - newRank);
  }

  private static rankUpdateType(oldRank: number, newRank: number) {
    if (newRank > oldRank) {
      return "Lost";
    }
    return "Gained";
  }

  private static leaderboardIcon(leaderboard: string) {
    switch (leaderboard) {
      case "BeatLeader":
        return `https://beatleader.com/assets/logo-small.png`;
      case "ScoreSaber":
        return `https://bsaber.com/uploads/communities/scoresaber-logo-reuben-afriendlypug-.png`;
      case "AccSaber":
      case "AccSaber (Tech Acc)":
      case "AccSaber (True Acc)":
      case "AccSaber (Standard Acc)":
        return `https://accsaber.com/assets/logo-DduqGXE6.png`;
      default:
        return `https://tiermaker.com/images/template_images/2022/15746443/youtube-emotes-15746443/face-orange-biting-nails.png`;
    }
  }

  private static leaderboardColor(leaderboard: string) {
    switch (leaderboard) {
      case "BeatLeader":
        return 0xec018e;
      case "ScoreSaber":
        return 0xffde18;
      default:
        return 0x000000;
    }
  }

  private static rankUpdateColor(oldRank: number, newRank: number) {
    if (newRank > oldRank) {
      return 0xff0000;
    }
    return 0x00ff00;
  }

  /**
   * Returns an embed of a Beat Saber rank update
   * @returns Discord embed of the rank update
   */
  public static getEmbed(data: {
    playerName: string;
    playerAvatar: string;
    playerId: string;
    leaderboard: string;
    oldRank: number;
    newRank: number;
    playerUrl: string;
    abovePlayerName: string | undefined;
    abovePlayerPP: number | undefined;
    pp: number | undefined;
  }): EmbedBuilder {
    const rankUpdateType = this.rankUpdateType(data.oldRank, data.newRank);
    const rankDifference = this.rankDifference(data.oldRank, data.newRank);

    const leaderboardIcon = this.leaderboardIcon(data.leaderboard);
    const embed = new EmbedBuilder()
      .setAuthor({
        name: data.playerName,
        iconURL: data.playerAvatar,
        url: data.playerUrl,
      })
      .setTitle(
        `${rankUpdateType} **${rankDifference} rank${rankDifference == 1 ? "" : "s"}** on ${data.leaderboard}!`,
      )
      .setThumbnail(leaderboardIcon)
      .setDescription(`# \u200B#${data.oldRank} -> #${data.newRank}`)
      .setColor(this.rankUpdateColor(data.oldRank, data.newRank))
      .setTimestamp();

    if (data.abovePlayerName && data.abovePlayerPP && data.pp) {
      embed.addFields({
        name: "Next Rank",
        value: `${data.abovePlayerName} (+${(data.abovePlayerPP - data.pp).toFixed(2)}pp)`,
      });
    }

    return embed;
  }
}
