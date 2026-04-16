import { EmbedBuilder } from "discord.js";

export default class RankDisplay {
    player: any;
    leaderboard: number;
    oldRank: number;
    newRank: number;

    constructor(player: any, leaderboard: number, oldRank: number, newRank: number) {
        this.player = player;
        this.leaderboard = leaderboard;
        this.oldRank = oldRank;
        this.newRank = newRank;
    }

    get leaderboardName() {
        switch (this.leaderboard) {
            case 0:
                return "BeatLeader"
            case 1:
                return "ScoreSaber"
            default:
                return ""
        }
    }

    get rankDifference() {
        return Math.abs(this.oldRank - this.newRank)
    }

    get rankUpdateType() {
        if (this.newRank > this.oldRank) {
            return "Lost"
        }
        return "Gained"
    }

    get leaderboardIcon() {
        switch (this.leaderboard) {
            case 0:
                return `https://beatleader.com/assets/logo-small.png`
            case 1:
                return `https://bsaber.com/uploads/communities/scoresaber-logo-reuben-afriendlypug-.png`
            default:
                return `https://tiermaker.com/images/template_images/2022/15746443/youtube-emotes-15746443/face-orange-biting-nails.png`
        } 
    }

    get leaderboardColor() {
        switch (this.leaderboard) {
            case 0:
                return 0xEC018E
            case 1:
                return 0xFFDE18
            default:
                return 0x000000
        }
    }

    /**
     * Returns an embed of a Beat Saber rank update
     * @returns Discord embed of the rank update
     */
    getEmbed(): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setAuthor({
                name: this.player.name,
                iconURL: this.player.avatar,
                url: `https://beatleader.com/u/${this.player.id}`,
            })
            .setTitle(`${this.rankUpdateType} **${this.rankDifference} rank${this.rankDifference == 1 ? "" : "s"}** on ${this.leaderboardName}!`)
            .setThumbnail(this.leaderboardIcon)
            .setDescription(`# #${this.oldRank} -> #${this.newRank}`)
            .setColor(this.leaderboardColor)
            .setTimestamp()
            

        return embed;
    }
}