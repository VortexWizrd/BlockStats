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
});

export default model('ScoreFeed', scoreFeedSchema);