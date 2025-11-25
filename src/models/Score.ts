import { Schema, model } from 'mongoose';

const scoreSchema = new Schema({
    discordId: {
        type: String,
    },
    beatLeaderData: {
        type: Object
    },
    scoreSaberData: {
        type: Object
    },
    upVoteIds: {
        type: [String],
        required: true,
        default: []
    },
    downVoteIds: {
        type: [String],
        required: true,
        default: []
    },
    messages: {
        type: [{
            messageId: {
                type: String,
                required: true
            },
            channelId: {
                type: String,
                required: false
            },
            guildId: {
                type: String,
                required: false
            },
            userId: {
                type: String,
                required: false
            }
        }],
        required: true,
        default: []
    }
});

export default model('Score', scoreSchema);