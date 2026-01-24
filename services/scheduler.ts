import * as cron from 'node-cron';

import { updateAllMemberRanks } from '../helpers/updateAllMemberRanks';
import { getDiscordClient } from '../discord';

export const initialize = () => {
    // Schedule a job to run every Monday at 00:00 UTC to update all member's cabbage counts
    const client = getDiscordClient();
    cron.schedule(
        '0 0 * * 1',
        () => {
            console.log(
                `Running scheduled job to update all member's cabbage counts`
            );
            const startTime = performance.now();
            updateAllMemberRanks(client);
            const endTime = performance.now();
            console.log(
                `Scheduled job to update all member's cabbage counts is complete (This took ${
                    endTime - startTime
                } ms)`
            );
        },
        { timezone: 'UTC' }
    );
};
