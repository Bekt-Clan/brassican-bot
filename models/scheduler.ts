import * as mongoose from 'mongoose';

import { getMongooseClient } from '../config/database';

export interface IScheduler extends mongoose.Document {
    command: string;
    arguments: JSON;
    timestamp: number;
    user_id: string;
    channel_id: string;
    createdAt: string;
    updatedAt: string;
}

export const mongooseClient = getMongooseClient();
export const SchedulerSchema = new mongooseClient.Schema<IScheduler>({
    command: { type: String, required: true },
    arguments: { type: Object, required: true },
    timestamp: { type: Number, required: true },
    user_id: { type: String, required: false },
    channel_id: { type: String, required: false },
});

SchedulerSchema.set('timestamps', true);
export const Scheduler = mongooseClient.model<IScheduler>(
    'Scheduler',
    SchedulerSchema
);
