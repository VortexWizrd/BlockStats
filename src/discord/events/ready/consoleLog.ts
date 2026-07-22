import { Client, Events } from "discord.js";

export default {
  data: {
    type: Events.ClientReady,
    once: true,
  },
  execute(client: Client): void {
    console.log(`[LOG]: Discord: Ready! Logged in as ${client.user?.tag}`);
  },
};
