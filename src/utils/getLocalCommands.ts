import path from 'path';
import getAllFiles from './getAllFiles';

module.exports = (exceptions: string[] = []) => {
    let localCommands = [];

    const commandCategories = getAllFiles(
        path.join(__dirname, '../commands'),
        true
    );

    for (const category of commandCategories) {
        const commandFiles = getAllFiles(category);

        for (const file of commandFiles) {
            const commandObject = require(file);

            if (exceptions.includes(commandObject.data.name)) continue;

            localCommands.push(commandObject);
        }
    }

    return localCommands;
}