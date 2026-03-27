import {
    Client,
    TextChannel,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from 'discord.js';
import {
    IScheduledCommand,
    ScheduledCommand,
    TEMPORARY_RANK_TYPE,
} from '../models/scheduledCommand';
import { Environment } from './environment';
import { Member } from '../models/member';
import { mapPointsToRank } from '../helpers/mapPointsToRank';
import { getWOMClient } from '../config/wom';

const removeTemporaryRank = async (discordID: string, client: Client) => {
    try {
        const memberData = await Member.findOne({ discordID });
        if (memberData) {
            const correctRank = mapPointsToRank(memberData.currentCabbages);

            const womClient = getWOMClient();
            const playerDetails = await womClient.players.getPlayerDetailsById(
                parseInt(memberData.womID, 10)
            );
            const RSN =
                playerDetails.displayName ||
                playerDetails.username ||
                'unknown';

            const complete = new ButtonBuilder()
                .setCustomId('completeRankUpdate')
                .setLabel('Complete')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                complete
            );

            const rankUpdatesChannel = client.channels.cache.get(
                Environment.RANK_UPDATES_CHANNEL
            ) as TextChannel;

            if (rankUpdatesChannel) {
                rankUpdatesChannel.send({
                    content: `<@${discordID}> (RSN: \`${RSN}\`) needs their temporary rank removed and restored to their correct rank in-game: **${correctRank}**`,
                    components: [row],
                });
            }
        }
    } catch (error) {
        console.error(
            `Error removing temporary rank for user ${discordID}:`,
            error
        );
    }
};

const executeScheduledCommand = async (
    scheduledCommand: IScheduledCommand,
    client: Client
) => {
    try {
        if (
            scheduledCommand.type === 'TEMPORARY_RANK' &&
            scheduledCommand.rankType
        ) {
            await removeTemporaryRank(scheduledCommand.discordID, client);
        }

        await ScheduledCommand.findByIdAndDelete(scheduledCommand._id);
        console.log(
            `Executed and deleted scheduled command ${scheduledCommand._id}`
        );
    } catch (error) {
        console.error(
            `Error executing scheduled command ${scheduledCommand._id}:`,
            error
        );
    }
};

const checkScheduledCommands = async (client: Client) => {
    try {
        const now = new Date();
        const commandsToExecute = await ScheduledCommand.find({
            executeAt: { $lte: now },
        });

        if (commandsToExecute.length > 0) {
            console.log(
                `Found ${commandsToExecute.length} scheduled command(s) ready to execute`
            );
        }

        for (const command of commandsToExecute) {
            await executeScheduledCommand(command, client);
        }
    } catch (error) {
        console.error('Error checking scheduled commands:', error);
    }
};

export { checkScheduledCommands };

export const cancelScheduledCommand = async (scheduledCommandId: string) => {
    try {
        const result =
            await ScheduledCommand.findByIdAndDelete(scheduledCommandId);

        if (!result) {
            console.log(`Scheduled command ${scheduledCommandId} not found`);
            return false;
        }

        console.log(`Deleted scheduled command ${scheduledCommandId}`);
        return true;
    } catch (error) {
        console.error(
            `Error cancelling scheduled command ${scheduledCommandId}:`,
            error
        );
        return false;
    }
};

export const getActiveScheduledCommands = async () => {
    return await ScheduledCommand.find({
        executeAt: { $gt: new Date() },
    }).sort({ executeAt: 1 });
};

export const addTemporaryRank = async (
    discordID: string,
    rankType: TEMPORARY_RANK_TYPE,
    durationDays: number,
    createdBy: string,
    client: Client
) => {
    try {
        const memberData = await Member.findOne({ discordID });
        if (!memberData) {
            throw new Error(`Member not found for Discord ID: ${discordID}`);
        }

        const womClient = getWOMClient();
        const playerDetails = await womClient.players.getPlayerDetailsById(
            parseInt(memberData.womID, 10)
        );
        const RSN =
            playerDetails.displayName || playerDetails.username || 'unknown';

        const rankDisplayName = (() => {
            const rankNames: Record<TEMPORARY_RANK_TYPE, string> = {
                INFERNAL_CAPE: 'Infernal Cape',
                MAX_CAPE: 'Max Cape',
                CABBAGE_RANK: 'Cabbage',
            };

            return rankNames[rankType];
        })();

        const complete = new ButtonBuilder()
            .setCustomId('completeRankUpdate')
            .setLabel('Complete')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            complete
        );

        const rankUpdatesChannel = client.channels.cache.get(
            Environment.RANK_UPDATES_CHANNEL
        ) as TextChannel;

        if (rankUpdatesChannel) {
            rankUpdatesChannel.send({
                content: `<@${discordID}> (RSN: \`${RSN}\`) needs their temporary rank updated in-game to: **${rankDisplayName}** (temporary for ${durationDays} day${durationDays !== 1 ? 's' : ''})`,
                components: [row],
            });
        }

        const executeAt = new Date();
        executeAt.setDate(executeAt.getDate() + durationDays);

        const scheduledCommand = new ScheduledCommand({
            type: 'TEMPORARY_RANK',
            discordID,
            rankType,
            executeAt,
            createdBy,
        });

        await scheduledCommand.save();

        console.log(
            `Scheduled temporary rank for user ${discordID}: ${rankDisplayName} until ${executeAt.toISOString()}`
        );

        return scheduledCommand;
    } catch (error) {
        console.error('Error adding temporary rank:', error);
        throw error;
    }
};
