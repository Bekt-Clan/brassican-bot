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
} from '../models/scheduledCommand';
import {
    getTemporaryRankDisplayName,
    TEMPORARY_RANK_TYPE,
} from '../config/temporaryRanks';
import { Environment } from './environment';
import { Member } from '../models/member';
import { mapPointsToRank } from '../helpers/mapPointsToRank';
import { getRsnByWomId } from '../helpers/wom';
import * as schedule from 'node-schedule';
import { addJob, removeJob } from '../stores/scheduler';

const removeTemporaryRank = async (discordID: string, client: Client) => {
    try {
        const memberData = await Member.findOne({ discordID });
        if (memberData) {
            const correctRank = mapPointsToRank(memberData.currentCabbages);

            const rsn = await getRsnByWomId(memberData.womID);

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
                    content: `<@${discordID}> (RSN: \`${rsn || 'unknown'}\`) needs their temporary rank removed and restored to their correct rank in-game: **${correctRank}**`,
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
        switch (scheduledCommand.type) {
            case 'TEMPORARY_RANK':
                if (scheduledCommand.metadata?.rankType) {
                    await removeTemporaryRank(
                        scheduledCommand.discordID,
                        client
                    );
                }
                break;
            default:
                console.warn(
                    `Unknown scheduled command type: ${scheduledCommand.type}`
                );
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

const scheduleCommandJob = (
    command: IScheduledCommand,
    client: Client
): void => {
    const job = schedule.scheduleJob(command.executeAt, async () => {
        await executeScheduledCommand(command, client);
        removeJob(String(command._id));
    });

    if (job) {
        addJob(String(command._id), job);
    }
};

export const reschedulePersistedCommands = async (client: Client) => {
    try {
        const now = new Date();

        const overdueCommands = await ScheduledCommand.find({
            executeAt: { $lte: now },
        });

        if (overdueCommands.length > 0) {
            console.log(
                `Found ${overdueCommands.length} overdue scheduled command(s), executing immediately`
            );
        }

        for (const command of overdueCommands) {
            await executeScheduledCommand(command, client);
        }

        const futureCommands = await ScheduledCommand.find({
            executeAt: { $gt: now },
        });

        if (futureCommands.length > 0) {
            console.log(
                `Scheduling ${futureCommands.length} pending scheduled command(s)`
            );
        }

        for (const command of futureCommands) {
            scheduleCommandJob(command, client);
        }
    } catch (error) {
        console.error('Error rescheduling persisted commands:', error);
    }
};

export const checkAndExecuteHangingCommands = async (
    client: Client
): Promise<void> => {
    try {
        const hangingCommands = await ScheduledCommand.find({
            executeAt: { $lte: new Date() },
        });

        if (hangingCommands.length > 0) {
            console.warn(
                `Warning: Found ${hangingCommands.length} hanging scheduled command(s) that were not executed on time:`,
                hangingCommands.map((c) => ({
                    id: c._id,
                    type: c.type,
                    executeAt: c.executeAt,
                }))
            );
        }

        for (const command of hangingCommands) {
            await executeScheduledCommand(command, client);
        }
    } catch (error) {
        console.error('Error checking for hanging commands:', error);
    }
};

export const cancelScheduledCommand = async (scheduledCommandId: string) => {
    try {
        removeJob(scheduledCommandId);

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

        const rsn = await getRsnByWomId(memberData.womID);

        const rankDisplayName = getTemporaryRankDisplayName(rankType);

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
                content: `<@${discordID}> (RSN: \`${rsn || 'unknown'}\`) needs their temporary rank updated in-game to: **${rankDisplayName}** (temporary for ${durationDays} day${durationDays !== 1 ? 's' : ''})`,
                components: [row],
            });
        }

        const executeAt = new Date();
        executeAt.setDate(executeAt.getDate() + durationDays);

        const scheduledCommand = new ScheduledCommand({
            type: 'TEMPORARY_RANK',
            discordID,
            metadata: { rankType },
            executeAt,
            createdBy,
        });

        await scheduledCommand.save();
        scheduleCommandJob(scheduledCommand, client);

        console.log(
            `Scheduled temporary rank for user ${discordID}: ${rankDisplayName} until ${executeAt.toISOString()}`
        );

        return scheduledCommand;
    } catch (error) {
        console.error('Error adding temporary rank:', error);
        throw error;
    }
};
