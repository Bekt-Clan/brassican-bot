import { Emoji } from 'discord.js';
import { ModifiedDiscordClient } from '../discord';

export const findGuildEmoji = (client: ModifiedDiscordClient, name: string) => {
    const emoji = client.emojis.cache.find(
        (cachedEmoji: Emoji) =>
            cachedEmoji.name?.toLowerCase() === name.toLowerCase()
    );

    return emoji || '';
};
