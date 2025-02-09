import { Environment } from '../services/environment';
import { TextChannel } from 'discord.js';
import { getDiscordClient } from '../discord';
import * as fs from 'node:fs';
import * as nodePath from 'node:path';

const __dirname = nodePath.resolve();
const MINIMUM_MESSAGE_LENGTH = 1200;
const MAXIMUM_MESSAGE_LENGTH = 2000;

const getLastUpdateDiscord = async (channelID: string): Promise<Date> => {
    const client = getDiscordClient();
    const channel = (await client.channels.fetch(channelID)) as TextChannel;
    const lastMessage = (await channel.messages.fetch({ limit: 1 })).first();
    if (lastMessage === undefined) {
        // Channel is empty so return very early date which acts as -inf
        return new Date(0);
    }
    return new Date(lastMessage.createdTimestamp);
};

const getLastUpdateDocs = (channelName: string): Date => {
    try {
        const stats = fs.statSync(`${__dirname}/docs/${channelName}.md`);

        if (!stats) {
            console.error(
                `File stats are empty for: ${__dirname}/docs/${channelName}.md`
            );
            return new Date();
        }

        return stats.mtime;
    } catch (error) {
        console.error('Error getting file stats:', error);
        return new Date();
    }
};

const isHeader = (text: string): boolean =>
    /^\*\*/.test(text) || /^#+\s+/.test(text);

const parseFileContents = (path: string): string[] => {
    const content = fs.readFileSync(path, 'utf8');
    // Normalize the content by removing extra newlines
    const lines = content
        .split(/\r\n|\n|\r/)
        .filter((line) => line !== '')
        .map((line) => line.concat('\n'));

    const messages: string[] = [];
    let currentMessage = '';

    for (const line of lines) {
        // If currentMessage is getting long and line is a header, finish currentMessage and start a new one
        if (currentMessage.length > MINIMUM_MESSAGE_LENGTH && isHeader(line)) {
            messages.push(currentMessage);
            currentMessage = line;
            continue;
        }

        // Merge currentMessage with line if their lengths allow it
        if (currentMessage.length + line.length < MAXIMUM_MESSAGE_LENGTH) {
            currentMessage = currentMessage.concat(line);
            continue;
        }

        // Otherwise finish currentMessage and start a new one
        messages.push(currentMessage);
        currentMessage = line;
    }

    // Append any remaining content to the messages array
    if (currentMessage !== '') {
        messages.push(currentMessage);
    }

    return messages;
};

const repostMessages = async (channelID: string, messages: string[]) => {
    const client = getDiscordClient();
    const channel = (await client.channels.fetch(channelID)) as TextChannel;
    // Fetch and delete all existing messages
    const lastMessages = await channel.messages.fetch({ limit: 100 });
    for (const [, message] of lastMessages) {
        await message.delete();
    }

    // Repost the messages
    let firstMessageId;
    for (const [index, msg] of messages.entries()) {
        const postedMessage = await channel.send(msg);
        if (index === 0) {
            firstMessageId = postedMessage.id;
        }
    }
    const link = `https://discord.com/channels/${Environment.GUILD_ID}/${channelID}/${firstMessageId}`;
    await channel.send(
        `:arrow_up: [Click Here to Jump to the Top](${link}) :arrow_up:`
    );
};

const updateChannel = async (name: string, channelID: string) => {
    try {
        const discordDate = await getLastUpdateDiscord(channelID);
        const docsDate = getLastUpdateDocs(name);
        if (docsDate > discordDate) {
            const path = `${__dirname}/docs/${name}.md`;
            const messages = parseFileContents(path);
            await repostMessages(channelID, messages);
        }
    } catch (error) {
        console.error(
            `Something went wrong whilst updating channel '${name}': `,
            error
        );
    }
};

export const initialize = async () => {
    console.log('Started updating docs');
    await Promise.all([
        updateChannel('rank-channel', Environment.RANK_CHANNEL),
    ]);
    console.log('Finished updating docs');
};
