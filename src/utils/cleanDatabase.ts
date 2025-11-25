import Score from "../models/Score";

export default async function cleanDatabase() {
    await Score.deleteMany({ beatLeaderData: null });
}
