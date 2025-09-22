import { CommandInteraction, SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import ScoreFeed from '../../models/ScoreFeed';
import Player from '../../models/Player';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scorefeed')
        .setDescription('Manage Beat Saber score feed')
        .addSubcommand((subcommand) => subcommand
            .setName('add')
            .setDescription('Create a score feed in the current channel')
            .addStringOption((option) => option
                .setName('request_type')
                .setDescription('Select whether server members can join the score feed')
                .setRequired(true)
                .addChoices(
                    { name: 'closed', value: 'closed' },
                    { name: 'invite', value: 'invite' },
                    { name: 'open', value: 'open' },
                ))
            .addStringOption((option) => option
                .setName('display_type')
                .setDescription('Select how you want scores to be displayed')
                .setRequired(true)
                .addChoices(
                    { name: 'embed', value: 'embed' }
                )))
        .addSubcommand((subcommand) => subcommand
            .setName('remove')
            .setDescription('Remove the score feed from the current server'))
        .addSubcommand((subcommand) => subcommand
            .setName('link')
            .setDescription('Add a BeatLeader profile to the score feed')
            .addStringOption((option) => option
                .setName('id')
                .setDescription('BeatLeader profile ID')
                .setRequired(true)))
        .addSubcommand((subcommand) => subcommand
            .setName('unlink')
            .setDescription('Remove a BeatLeader profile from the score feed')
            .addStringOption((option) => option
                .setName('id')
                .setDescription('BeatLeader profile ID')
                .setRequired(true)))
        .addSubcommand((subcommand) => subcommand
            .setName('request')
            .setDescription('Request your profile to be added to the score feed')),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'You must be in a server to use this command!', ephemeral: true });
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case 'add': {
                // Check if user has permissions
                const member = interaction.guild.members.cache.get(interaction.user.id);
                if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
                    return;
                }

                // Check if score feed already exists for this server
                const query = { guildId: interaction.guild.id };
                const existingFeed = await ScoreFeed.findOne(query);
                if (existingFeed) {
                    await interaction.reply({ content: 'A score feed already exists for this server! Please use the `edit` or `remove` command to modify it.', ephemeral: true });
                    return;
                }

                // Create a new score feed
                const newFeed = new ScoreFeed({
                    guildId: interaction.guild.id,
                    channelId: interaction.channel?.id,
                    displayType: interaction.options.getString('display_type'),
                    requestType: interaction.options.getString('request_type')

                });
                await newFeed.save();

                await interaction.reply({ content: 'Score feed created!', ephemeral: true });
                break;
            }

            case 'remove': {
                // Handle removing a score feed
                const member = interaction.guild.members.cache.get(interaction.user.id);
                if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
                    return;
                }

                // Check if score feed exists for this server
                const feed = await ScoreFeed.findOne({ guildId: interaction.guild.id });
                if (!feed) {
                    await interaction.reply({ content: 'No score feed exists for this server!', ephemeral: true });
                    return;
                }

                // Remove the score feed
                await ScoreFeed.deleteOne({ guildId: interaction.guild.id });
                await interaction.reply({ content: 'Score feed removed!', ephemeral: true });
                break;
            }

            case 'link': {
                // Check if user has permissions
                const member = interaction.guild.members.cache.get(interaction.user.id);
                if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
                    return;
                }

                // Handle adding a player to the score feed
                const beatleaderId = interaction.options.getString('id', true);
                if (!beatleaderId) {
                    await interaction.reply({ content: 'You must provide a valid BeatLeader ID!', ephemeral: true });
                    return;
                }

                // Check if score feed exists for this server
                const feed = await ScoreFeed.findOne({ guildId: interaction.guild.id });
                if (!feed) {
                    await interaction.reply({ content: 'No score feed exists for this server!', ephemeral: true });
                    return;
                }

                // Add player to the score feed
                if (feed.beatleaderIds.includes(beatleaderId)) {
                    await interaction.reply({ content: 'This player is already linked to the score feed!', ephemeral: true });
                    return;
                }
                feed.beatleaderIds.push(beatleaderId);
                await feed.save();

                await interaction.reply({ content: `Player with BeatLeader ID [${beatleaderId}](https://beatleader.com/u/${beatleaderId}) linked to the score feed!`, ephemeral: true });

                break;
            }

            case 'unlink': {
                // Check if user has permissions
                const member = interaction.guild.members.cache.get(interaction.user.id);
                if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
                    return;
                }

                // Handle removing a player from the score feed
                const beatleaderId = interaction.options.getString('id', true);
                if (!beatleaderId) {
                    await interaction.reply({ content: 'You must provide a valid BeatLeader ID!', ephemeral: true });
                    return;
                }
                
                // Check if score feed exists for this server
                const feed = await ScoreFeed.findOne({ guildId: interaction.guild.id });
                if (!feed) {
                    await interaction.reply({ content: 'No score feed exists for this server!', ephemeral: true });
                    return;
                }

                if (beatleaderId === 'all') {
                    feed.beatleaderIds = [];
                    await feed.save();
                    
                    await interaction.reply({ content: 'All players unlinked from the score feed!', ephemeral: true });
                    return;
                }
                
                // Remove player from the score feed
                if (!feed.beatleaderIds.includes(beatleaderId)) {
                    await interaction.reply({ content: 'This player is not linked to the score feed!', ephemeral: true });
                    return;
                }
                feed.beatleaderIds = feed.beatleaderIds.filter(id => id !== beatleaderId);
                await feed.save();

                await interaction.reply({ content: `Player with BeatLeader ID [${beatleaderId}](https://beatleader.com/u/${beatleaderId}) unlinked from the score feed!`, ephemeral: true });

                break;
            }

            case 'request': {
                const player = await Player.findOne({discordId: interaction.user.id});
                if (!player) {
                    return await interaction.reply({content: "Link your profile using /link before using this command!", ephemeral: true})
                }

                const feed = await ScoreFeed.findOne({guildId: interaction.guild.id});
                if (!feed) {
                    return await interaction.reply({content: "No score feed exists for this server!", ephemeral: true});
                }

                switch (feed.requestType) {
                    case "closed": {
                        return await interaction.reply({content: "This server's score feed is not taking profile requests!", ephemeral: true});
                    }
                    case "invite": {
                        feed.requestIds.push(player.beatLeaderId);
                        feed.save().catch(err => console.log(err));
                        return await interaction.reply({content: "Your request has been sent! Please wait until someone accepts your request.", ephemeral: true});

                    }
                    case "open": {
                        feed.beatleaderIds.push(player.beatLeaderId);
                        feed.save().catch(err => console.log(err));
                        return await interaction.reply({content: "Your profile has been added to the score feed!", ephemeral: true});
                    }
                }

                
            }
        }
    }
    
}