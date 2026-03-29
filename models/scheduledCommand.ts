import * as mongoose from 'mongoose';

import { getMongooseClient } from '../config/database';
import { TEMPORARY_RANK_TYPE } from '../config/temporaryRanks';

export type SCHEDULED_ACTION_TYPE = 'TEMPORARY_RANK';

export interface ITemporaryRankMetadata {
    rankType: TEMPORARY_RANK_TYPE;
}

export interface IScheduledCommand extends mongoose.Document {
    type: SCHEDULED_ACTION_TYPE;
    discordID: string;
    metadata?: ITemporaryRankMetadata;
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
        metadata: { type: mongoose.Schema.Types.Mixed },
        executeAt: { type: Date, required: true },
        createdBy: { type: String, required: true },
    });

ScheduledCommandSchema.set('timestamps', true);

export const ScheduledCommand = mongooseClient.model<IScheduledCommand>(
    'ScheduledCommand',
    ScheduledCommandSchema
);
