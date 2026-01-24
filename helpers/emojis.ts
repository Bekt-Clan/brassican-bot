import { ApplicationEmoji } from 'discord.js';
import { getDiscordClient } from '../discord';

export const findApplicationEmoji = (name: string) => {
    const client = getDiscordClient();
    const emoji = client.application?.emojis.cache.find(
        (cachedEmoji: ApplicationEmoji) => cachedEmoji.name === name
    );
    if (!emoji) {
        console.warn(
            `Something went wrong with finding ApplicationEmoji: ${name}`
        );
    }
    return emoji || '';
};
