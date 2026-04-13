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
            default: false
        }
    },
    blRank: {
        type: Number,
        required: true,
        default: -1
    },
    ssRank: {
        type: Number,
    },
});

export default model("Player", playerSchema);
