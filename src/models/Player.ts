import { Schema, model } from 'mongoose';

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
        type: String
    },
    scoreIds: {
        type: [String],
        required: true,
        default: []
    }
});

export default model('Player', playerSchema);