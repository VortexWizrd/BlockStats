// Define accuracy color theme
const colorPairs = [
    { threshold: 0.95, value: 0x8f48db },
    { threshold: 0.9, value: 0xbf2a42 },
    { threshold: 0.85, value: 0xff6347 },
    { threshold: 0.8, value: 0x59b0f4 },
    { threshold: 0.7, value: 0x3cb371 },
    { threshold: 0, value: 0x3e3e3e },
];

/**
 * Returns a hex color based on the BeatLeader accuracy color scheme
 * @param {number} accuracy - Score accuracy (in decimal form)
 * @returns {number} Hex color value
 */
export default function getAccuracyColor(accuracy: number): number {
    for (const colorPair of colorPairs) {
        if (accuracy >= colorPair.threshold) {
            return colorPair.value;
        }
    }
    console.warn(
        "getAccuracyColor: no color pairs defined, defaulting to 0x000000"
    );
    return 0x000000;
}
