import Score from "../models/Score";

export default async function cleanDatabase() {
    const scores = await Score.find({ beatLeaderData: null });
    for (const score of scores) {
        Score.deleteOne({ _id: score._id });
    }
}