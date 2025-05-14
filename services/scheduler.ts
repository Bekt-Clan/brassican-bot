import * as schedule from 'node-schedule';

import { updateAllMemberRanks } from '../helpers/updateAllMemberRanks';
import { getDiscordClient } from '../discord';
import { Scheduler } from '../models/scheduler';
import { updateMemberRank } from '../helpers/updateMemberRank';

export const initialize = async () => {
    // Schedule a job to run every Monday at 00:00 UTC to update all member's cabbage counts
    const client = getDiscordClient();

    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = 1;
    rule.hour = 0;
    rule.minute = 0;
    rule.tz = 'Etc/UTC';

    schedule.scheduleJob(rule, () => {
        console.log(
            "Running scheduled job to update all member's cabbage counts"
        );

        const startTime = performance.now();
        updateAllMemberRanks(client).then(() => {
            const endTime = performance.now();
            console.log(
                `Scheduled job to update all member's cabbage counts is complete (This took ${
                    endTime - startTime
                } ms)`
            );
        });
    });

    const scheduledActions = await Scheduler.find();

    for (const scheduledAction of scheduledActions) {
        if (scheduledAction.timestamp < new Date().getTime()) {
            try {
                console.log(
                    `Running scheduled action: ${scheduledAction.command}`
                );

                switch (scheduledAction.command) {
                    case 'giveRank':
                        await updateMemberRank(
                            (
                                scheduledAction.arguments as unknown as {
                                    user: string;
                                    rank: string;
                                }
                            ).user,
                            client
                        );
                        break;
                    default:
                        throw new Error(
                            `Unknown scheduled action: ${scheduledAction.command}`
                        );
                }

                // delete the scheduled action after running it
                await Scheduler.deleteOne({ _id: scheduledAction._id });
            } catch (error) {
                console.error(
                    `Error running scheduled action: ${scheduledAction.command}`,
                    error
                );
            }
        } else {
            schedule.scheduleJob(scheduledAction.timestamp, async () => {
                try {
                    console.log(
                        `Running scheduled action: ${scheduledAction.command}`
                    );

                    switch (scheduledAction.command) {
                        case 'giveRank':
                            await updateMemberRank(
                                (
                                    scheduledAction.arguments as unknown as {
                                        user: string;
                                        rank: string;
                                    }
                                ).user,
                                client
                            );
                            break;
                        default:
                            throw new Error(
                                `Unknown scheduled action: ${scheduledAction.command}`
                            );
                    }

                    // delete the scheduled action after running it
                    await Scheduler.deleteOne({ _id: scheduledAction._id });
                } catch (error) {
                    console.error(
                        `Error running scheduled action: ${scheduledAction.command}`,
                        error
                    );
                }
            });

            console.log(
                `Scheduled action: ${scheduledAction.command} scheduled for ${new Date(scheduledAction.timestamp)}`
            );
        }
    }
};

export const scheduleAction = async (
    command: string,
    parameters: JSON,
    timestamp: number
) => {
    const scheduledAction = new Scheduler({
        command,
        arguments: parameters,
        timestamp,
    });

    await scheduledAction.save();

    schedule.scheduleJob(new Date(timestamp), async () => {
        try {
            console.log(`Running scheduled action: ${command}`);

            switch (command) {
                case 'giveRank':
                    await updateMemberRank(
                        (
                            parameters as unknown as {
                                user: string;
                                rank: string;
                            }
                        ).user,
                        getDiscordClient()
                    );
                    break;
                default:
                    throw new Error(`Unknown scheduled action: ${command}`);
            }

            // delete the scheduled action after running it
            await Scheduler.deleteOne({ _id: scheduledAction._id });
        } catch (error) {
            console.error(`Error running scheduled action: ${command}`, error);
        }
    });
};
