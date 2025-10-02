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
    },
    filters: {
        type: {
            scoreSaberStars: {
                type: Number,
                required: true,
                default: 0,
            },
            minScoreSaberPP: {
                type: Number,
                required: true,
                default: 0,
            },
            beatLeaderStars: {
                type: Number,
                required: true,
                default: 0,
            },
            minBeatLeaderPP: {
                type: Number,
                required: true,
                default: 0,
            },
            lowestRank: {
                type: Number,
            },
            maxMisses: {
                type: Number,
            },
            minAccuracy: {
                type: Number
            }
        },
    }
});

export default model('ScoreFeed', scoreFeedSchema);