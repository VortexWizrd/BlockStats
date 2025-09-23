import { Schema, model } from 'mongoose';

const scoreSchema = new Schema({
    discordId: {
        type: String,
        required: true
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
                required: true
            },
            guildId: {
                type: String,
                required: true
            }
        }],
        required: true,
        default: []
    }
});

export default model('Score', scoreSchema);