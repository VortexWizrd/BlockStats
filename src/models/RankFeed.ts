import { Schema, model } from "mongoose";

const rankFeedSchema = new Schema({
  guildId: {
    type: String,
    required: false,
  },
  channelId: {
    type: String,
    required: false,
  },
  userId: {
    type: String,
    required: false,
  },
  beatleaderIds: {
    type: [String],
    required: true,
  },
  displayType: {
    type: String,
    required: true,
    default: "embed",
  },
  requestType: {
    type: String,
    required: true,
    default: "closed",
  },
  requestIds: {
    type: [String],
    required: true,
  },
});

export default model("RankFeed", rankFeedSchema);
