import { Client, Events } from "discord.js";

module.exports = {
    data: {
        type: Events.ClientReady,
        once: false,
    },
    async execute(client: Client): Promise<void> {
        let lastCheckedDay = Math.floor(Date.now() / 8.64e7);

        setInterval(() => {
            if (Date.now() - lastCheckedDay * 8.64e7 > 8.64e7) {
                console.log("hi");
            }
        }, 60000);
    },
};
