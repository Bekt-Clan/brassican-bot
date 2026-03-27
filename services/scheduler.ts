import * as cron from 'node-cron';

import { updateAllMemberRanks } from '../helpers/updateAllMemberRanks';
import { getDiscordClient } from '../discord';
import { checkScheduledCommands } from './scheduledCommands';

export const initialize = () => {
    const client = getDiscordClient();

    cron.schedule(
        '0 0 * * 1',
        () => {
            console.log(
                `Running scheduled job to update all member's cabbage counts`
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
        },
        { timezone: 'UTC' }
    );

    cron.schedule('*/5 * * * *', () => {
        checkScheduledCommands(client);
    });

    checkScheduledCommands(client).then(() => {
        console.log('Initial scheduled commands check complete');
    });
};
