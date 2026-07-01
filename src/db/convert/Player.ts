import { Schema, model } from "mongoose";

const playerSchema = new Schema({
    discordId: {
        type: String,
        required: true,
    },
    beatLeaderId: {
        type: String,
        required: true,
    },
    scoreSaberId: {
        type: String,
    },
    scoreIds: {
        type: [String],
        required: true,
        default: [],
    },
    settings: {
        scoreCommentEvent: {
            type: Boolean,
            default: false,
        },
    },
    blRankHistory: {
        type: [
            {
                timestamp: {
                    type: Date,
                    required: true,
                },
                rank: {
                    type: Number,
                    required: true,
                },
            },
        ],
        required: true,
        default: [],
    },
    ssRankHistory: {
        type: [
            {
                timestamp: {
                    type: Date,
                    required: true,
                },
                rank: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
});

export default model("Player", playerSchema);
