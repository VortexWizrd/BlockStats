import { Client, Events, Message } from "discord.js";
import Player from "../../models/Player";
import Score from "../../models/Score";

module.exports = {
    data: {
        type: Events.MessageCreate,
        once: false,
    },
    async execute(message: Message): Promise<void> {
        if (!(message.type === 19)) return;

        const player = await Player.findOne({ discordId: message.author.id });
        if (!player) return;

        try {
            const replyId = message.reference?.messageId;
            if (!replyId) return;

            const score = await Score.findOne({ 'messages.messageId': replyId });
            if (!score) return;

            if (message.inGuild()) {
                score.comments.push({
                    messageId: message.id,
                    channelId: message.channel.id,
                    guildId: message.guild.id,
                    userId: message.author.id
                });
            } else {
                score.comments.push({
                    messageId: message.id,
                    channelId: message.channel.id,
                    userId: message.author.id
                });
            }

            await score.save().catch(e => {console.log(e)});
            
        } catch (err) {
            console.log(err);
        }
    },
};
