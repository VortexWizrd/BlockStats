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
  }): EmbedBuilder {
    const rankUpdateType = this.rankUpdateType(data.oldRank, data.newRank);
    const rankDifference = this.rankDifference(data.oldRank, data.newRank);

    const leaderboardIcon = this.leaderboardIcon(data.leaderboard);
    const leaderboardColor = this.leaderboardColor(data.leaderboard);
    const embed = new EmbedBuilder()
      .setAuthor({
        name: data.playerName,
        iconURL: data.playerAvatar,
        url: `https://beatleader.com/u/${data.playerId}`,
      })
      .setTitle(
        `${rankUpdateType} **${rankDifference} rank${rankDifference == 1 ? "" : "s"}** on ${data.leaderboard}!`,
      )
      .setThumbnail(leaderboardIcon)
      .setDescription(`# #${data.oldRank} -> #${data.newRank}`)
      .setColor(leaderboardColor)
      .setTimestamp();

    return embed;
  }
}
