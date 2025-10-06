import Score from "../models/Score";

export default async function cleanDatabase() {
    const scores = await Score.find();
    let i = 0;
    for (const score of scores) {
        if (score.beatLeaderData == null || score.beatLeaderData.timeset == null) {
            Score.deleteOne({ _id: score._id });
            i++;
        }
    }
    console.log("Removed " + i + " invalid scores!");
}