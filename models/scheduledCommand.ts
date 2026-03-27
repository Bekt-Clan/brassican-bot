import * as mongoose from 'mongoose';

import { getMongooseClient } from '../config/database';

export type SCHEDULED_ACTION_TYPE = 'TEMPORARY_RANK';

export type TEMPORARY_RANK_TYPE = 'INFERNAL_CAPE' | 'MAX_CAPE' | 'CABBAGE_RANK';

export interface IScheduledCommand extends mongoose.Document {
    type: SCHEDULED_ACTION_TYPE;
    discordID: string;
    rankType?: TEMPORARY_RANK_TYPE;
    executeAt: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const mongooseClient = getMongooseClient();

export const ScheduledCommandSchema =
    new mongooseClient.Schema<IScheduledCommand>({
        type: { type: String, required: true, uppercase: true },
        discordID: { type: String, required: true },
        rankType: { type: String, uppercase: true },
        executeAt: { type: Date, required: true },
        createdBy: { type: String, required: true },
    });

ScheduledCommandSchema.set('timestamps', true);

export const ScheduledCommand = mongooseClient.model<IScheduledCommand>(
    'ScheduledCommand',
    ScheduledCommandSchema
);
