import { EmbedBuilder } from "discord.js";

export default class RankDisplay {
  private static ppDifference(oldPP: number, newPP: number) {
    return Math.abs(oldPP - newPP);
  }

  private static ppUpdateType(oldPP: number, newPP: number) {
    if (newPP < oldPP) {
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

  private static ppUpdateColor(oldPP: number, newPP: number) {
    if (newPP < oldPP) {
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
    oldPP: number;
    newPP: number;
    playerUrl: string;
    abovePlayerName: string | undefined;
    abovePlayerPP: number | undefined;
  }): EmbedBuilder {
    const ppUpdateType = this.ppUpdateType(data.oldPP, data.newPP);
    const ppDifference = this.ppDifference(data.oldPP, data.newPP).toFixed(2);

    const leaderboardIcon = this.leaderboardIcon(data.leaderboard);
    const embed = new EmbedBuilder()
      .setAuthor({
        name: data.playerName,
        iconURL: data.playerAvatar,
        url: data.playerUrl,
      })
      .setTitle(`${ppUpdateType} **${ppDifference}pp** on ${data.leaderboard}!`)
      .setThumbnail(leaderboardIcon)
      .setDescription(
        `# \u200B${data.oldPP.toFixed(2)}pp -> ${data.newPP.toFixed(2)}pp`,
      )
      .setColor(this.ppUpdateColor(data.oldPP, data.newPP))
      .setTimestamp();

    if (data.abovePlayerName && data.abovePlayerPP) {
      embed.addFields({
        name: "Next Rank",
        value: `${data.abovePlayerName} (+${(data.abovePlayerPP - data.newPP).toFixed(2)}pp)`,
      });
    }

    return embed;
  }
}
