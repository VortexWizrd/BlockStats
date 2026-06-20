import { Client } from "discord.js";
import path from "path";
import getAllFiles from "../utils/getAllFiles.js";

export default async function eventHandler(client: Client): Promise<void> {
  const eventFolders = getAllFiles(
    path.join(import.meta.dirname, "..", "events"),
    true,
  );

  for (const folder of eventFolders) {
    const eventFiles = getAllFiles(folder, false).filter((file) =>
      file.endsWith(".js"),
    );

    for (const file of eventFiles) {
      const eventImport = await import(file);
      const event = eventImport.default;
      if (event.data.once) {
        client.once(event.data.type, (...args) => event.execute(...args));
      } else {
        client.on(event.data.type, (...args) => event.execute(...args));
      }
    }
  }
}
