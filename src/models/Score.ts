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
    messageIds: {
        type: [String],
        required: true,
        default: []
    }
});

export default model('Score', scoreSchema);