import { Schema, model } from 'mongoose';

const scoreFeedSchema = new Schema({
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    beatleaderIds: {
        type: [String],
        required: true
    },
    displayType: {
        type: String,
        required: true,
        default: "embed"
    },
    requestType: {
        type: String,
        required: true,
        default: "closed"
    },
    requestIds: {
        type: [String],
        required: true
    }
});

export default model('ScoreFeed', scoreFeedSchema);