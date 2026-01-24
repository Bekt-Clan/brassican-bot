import { Emoji } from 'discord.js';
import { getDiscordClient } from '../discord';

export const findApplicationEmoji = (name: string) => {
    const client = getDiscordClient();
    const emoji = client.application?.emojis.cache.find(
        (cachedEmoji: Emoji) => cachedEmoji.name === name
    );
    if (emoji === null || emoji === undefined) {
        console.log(
            `Something went wrong with finding ApplicationEmoji: ${name}`
        );
    }
    return emoji;
};
