import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Score from "../../models/Score";
import Player from "../../models/Player";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scores')
        .setDescription('Get a list of scores')
        .addSubcommand(subCommand => subCommand
            .setName('global')
            .setDescription('Get global scores')
            .addStringOption((option) => option
                .setName('sort')
                .setDescription('Sort scores by features')
                .setRequired(true)
                .addChoices(
                    { name: 'recent', value: 'recent' },
                    { name: 'likes', value: 'likes' },
                    { name: 'dislikes', value: 'dislikes' },
                    { name: 'highest-rating', value: 'highest-ratio' },
                    { name: 'lowest-rating', value: 'lowest-ratio' },
                )
            )
            .addIntegerOption((option) => option
                .setName('page')
                .setDescription('Page number')
            )
        )
        .addSubcommand(subCommand => subCommand
            .setName('player')
            .setDescription('Get player scores')
            .addStringOption((option) => option
                .setName('sort')
                .setDescription('Sort scores by features')
                .setRequired(true)
                .addChoices(
                    { name: 'recent', value: 'recent' },
                    { name: 'likes', value: 'likes' },
                    { name: 'dislikes', value: 'dislikes' },
                    { name: 'highest-rating', value: 'highest-ratio' },
                    { name: 'lowest-rating', value: 'lowest-ratio' },
                )
            )
            .addUserOption((option) => option
                .setName('user')
                .setDescription('Discord user'))
            .addIntegerOption((option) => option
                .setName('page')
                .setDescription('Page number')
            )
        ),
        
    async execute(interaction: ChatInputCommandInteraction) {

        const isGlobal: boolean = interaction.options.getSubcommand() === 'global';
        
        const sort = interaction.options.getString('sort');
        const user = interaction.options.getUser('user') || interaction.user;
        const page = interaction.options.getInteger('page') || 1;

        let sortTitle = "";
        let sortList = "";
        let scoreAuthor = "";

        let scores: any;
        if (isGlobal) {

            scores = await Score.find();

        } else {

            if (!Player.findOne({ discordId: interaction.user.id })) return await interaction.reply({
                content: "User has no linked profile(s)!",
                ephemeral: true
            })

            scores = await Score.find({ discordId: user.id })
        }

        // Sort scores
        switch (sort) {

            case 'recent': {

                sortTitle = "Recent"

                scores = scores.sort((a: any, b: any) => Number(b.beatLeaderData.timeset) - Number(a.beatLeaderData.timeset));

                break;

            }

            case 'likes': {

                sortTitle = "Most Liked"

                scores = scores.sort((a: any, b: any) => Number(b.upVoteIds.length) - Number(a.upVoteIds.length));

                break;

            }

            case 'dislike': {

                sortTitle = "Most Disliked"

                scores = scores.sort((a: any, b: any) => Number(b.downVoteIds.length) - Number(a.downVoteIds.length));

                break;

            }

            case 'highest-ratio': {

                sortTitle = "Highest Rated"

                scores = scores.sort((a: any, b: any) => {

                    const aTotalVotes = (a.upVoteIds.length + a.downVoteIds.length == 0 ? 1 : a.upVoteIds.length + a.downVoteIds.length);
                    const bTotalVotes = (b.upVoteIds.length + b.downVoteIds.length == 0 ? 1 : b.upVoteIds.length + b.downVoteIds.length);

                    const aRatio = (a.upVoteIds.length == a.downVoteIds.length ? 0.5 : a.upVoteIds.length / aTotalVotes);
                    const bRatio = (b.upVoteIds.length == b.downVoteIds.length ? 0.5 : b.upVoteIds.length / bTotalVotes);

                    if (Number(aRatio) > Number(bRatio)) {
                        return -1;
                    } else if (Number(aRatio) < Number(bRatio)) {
                        return 1;
                    } else {
                        return 0;
                    }
                })

                break;

            }

            case 'lowest-ratio': {

                sortTitle = "Lowest Rated"

                scores = scores.sort((a: any, b: any) => {

                    const aTotalVotes = (a.upVoteIds.length + a.downVoteIds.length == 0 ? 1 : a.upVoteIds.length + a.downVoteIds.length);
                    const bTotalVotes = (b.upVoteIds.length + b.downVoteIds.length == 0 ? 1 : b.upVoteIds.length + b.downVoteIds.length);

                    const aRatio = (a.upVoteIds.length == a.downVoteIds.length ? 0.5 : a.upVoteIds.length / aTotalVotes);
                    const bRatio = (b.upVoteIds.length == b.downVoteIds.length ? 0.5 : b.upVoteIds.length / bTotalVotes);

                    if (Number(aRatio) < Number(bRatio)) {
                        return -1;
                    } else if (Number(aRatio) > Number(bRatio)) {
                        return 1;
                    } else {
                        return 0;
                    }
                })

                break;

            }
        }

        // Create a list of scores
        for (let i = ((page - 1) * 5); i < (page * 5); i++) {
            if (i < scores.length) {
                let sortValue = "";
                let scoreAuthor = scores[i].beatLeaderData.player.name;

                if (sort === "likes") {
                    sortValue = scores[i].upVoteIds.length + " " + (scores[i].upVoteIds.length === 1 ? "like" : "likes")
                } else if (sort === "dislikes") {
                    sortValue = scores[i].downVoteIds.length + " " +(scores[i].downVoteIds.length === 1 ? "dislike" : "dislikes")
                } else if (sort === "highest-ratio" || sort === "lowest-ratio") {
                    const totalVotes = (scores[i].upVoteIds.length + scores[i].downVoteIds.length == 0 ? 1 : scores[i].upVoteIds.length + scores[i].downVoteIds.length);
                    const ratio = (scores[i].upVoteIds.length == scores[i].downVoteIds.length ? 0.5 : scores[i].upVoteIds.length / totalVotes);

                    sortValue = (ratio * 100).toFixed() + "% rating";
                }

                sortList += `## ${i+1}. ${scores[i].beatLeaderData.leaderboard.song.name} | #${scores[i].beatLeaderData.rank} • ${(scores[i].beatLeaderData.accuracy * 100).toFixed(2)}%${sortValue === "" ? "" : " | " + sortValue}\n${!isGlobal ? "" : `### Set by ${scores[i].beatLeaderData.player.name}\n`}[[Replay](https://replay.beatleader.com/?link=${scores[i].beatLeaderData.replay})] [ID: ${scores[i]._id}]\n`;
            }
        }

        if (sortList == "") sortList = "## No scores found :(";

        const embed = new EmbedBuilder()
            .setTitle(`${isGlobal ? "" : user.displayName + "'s "}${sortTitle} Scores${page === 1 ? "" : ` (Page ${page})`}`)
            .setDescription(sortList)
            .setTimestamp()

        if (!isGlobal) {
            embed.setThumbnail(user.displayAvatarURL())
        }

        return interaction.reply({ embeds: [embed] });

    }
}