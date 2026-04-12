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
    }
});

export default model("Player", playerSchema);
