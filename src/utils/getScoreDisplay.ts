import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, Embed, EmbedBuilder } from "discord.js";
import getAccuracyColor from "./getAccuracyColor";


export default class ScoreDisplay {

    score: any;

    constructor(score: any) {
        this.score = score;
    }

    /**
    * Returns an embed of a Beat Saber score
    * @returns Discord embed of the score
    */
    getEmbed(): EmbedBuilder {

        const embed = new EmbedBuilder()
            .setAuthor({
                name: this.score.beatLeaderData.player.name,
                iconURL: this.score.beatLeaderData.player.avatar,
                url: `https://beatleader.com/u/${this.score.beatLeaderData.player.id}`
            })
            .setTitle(`New score on **${this.score.beatLeaderData.leaderboard.song.name} ` +
                `${this.score.beatLeaderData.leaderboard.song.subName ? `${this.score.beatLeaderData.leaderboard.song.subName }` : ""} ` +
                `[` + 
                `${this.score.beatLeaderData.leaderboard.difficulty.difficultyName === "ExpertPlus" ? "Expert+" : this.score.beatLeaderData.leaderboard.difficulty.difficultyName}` +
                `${this.score.beatLeaderData.leaderboard.difficulty.modeName === "Standard" ? "" : this.score.beatLeaderData.leaderboard.difficulty.modeName}` +
                `${this.score.scoreSaberData && this.score.scoreSaberData.leaderboard.stars > 0 ? ` | ${this.score.scoreSaberData.leaderboard.stars.toFixed(2)}★ SS` : ""}` +
                `${this.score.beatLeaderData.leaderboard.difficulty.stars > 0 ? ` | ${this.score.beatLeaderData.leaderboard.difficulty.stars.toFixed(2)}★ BL` : ""}` +
                `]**`)
            .setURL(`https://replay.beatleader.com/?link=${this.score.beatLeaderData.replay}`)
            .setColor(getAccuracyColor(this.score.beatLeaderData.accuracy))
            .setThumbnail(this.score.beatLeaderData.leaderboard.song.coverImage)
            .setDescription(`# \u200B#${this.score.beatLeaderData.rank} • ` +
                `${(this.score.beatLeaderData.accuracy * 100).toFixed(2)}%  • ` +
                `${this.score.beatLeaderData.fullCombo ? "FC" :
                    `${this.score.beatLeaderData.missedNotes + this.score.beatLeaderData.badCuts} ` +
                    `${this.score.beatLeaderData.missedNotes + this.score.beatLeaderData.badCuts === 1 ? "Miss" : "Misses"}`}`)
            .setTimestamp(Number(this.score.beatLeaderData.timeset) * 1000);

            if (this.score.beatLeaderData.pp) {
                embed.addFields(
                    { name: "BeatLeader pp", value: this.score.beatLeaderData.pp.toFixed(2) + "pp", inline: true})
            }

            if (this.score.scoreSaberData) {
                if (this.score.scoreSaberData.score.pp > 0) {
                    embed.addFields(
                        { name: "ScoreSaber pp", value: this.score.scoreSaberData.score.pp.toFixed(2) + "pp", inline: true})
                }
            } 

            if (this.score.beatLeaderData.modifiers) {
                embed.addFields(
                    { name: "Modifiers", value: this.score.beatLeaderData.modifiers, inline: true})
            }

        return embed;
    }

    /**
     * Generates buttons (like, dislike, etc.) for the display
     * @returns Buttons stored in ActionRowBuilder
     */
    getButtons(): ActionRowBuilder<ButtonBuilder> {

        const like = new ButtonBuilder()
            .setCustomId('score-like')
            .setLabel('👍 Like • ' + this.score.upVoteIds.length)
            .setStyle(ButtonStyle.Success);
                    
        const dislike = new ButtonBuilder()
            .setCustomId('score-dislike')
            .setLabel('👎 Dislike • ' + this.score.downVoteIds.length)
            .setStyle(ButtonStyle.Danger);
                    
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(like, dislike);

        return row;
    }



    
}