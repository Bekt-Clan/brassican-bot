import * as mongoose from 'mongoose';

import { getMongooseClient } from '../config/database';

export type CA_TIER =
    | 'EASY'
    | 'MEDIUM'
    | 'HARD'
    | 'ELITE'
    | 'MASTER'
    | 'GRANDMASTER';

export type AD_TIER = 'EASY' | 'MEDIUM' | 'HARD' | 'ELITE';

export interface IMember extends mongoose.Document {
    womID: string;
    discordID: string;
    currentCabbages: number;
    currentRank: string;
    eventCabbages: number;
    accountProgression: {
        max: boolean;
        inferno: boolean;
        quiver: boolean;
        blorva: boolean;
        radiant: boolean;
        questCape: boolean;
        clogSlots: number;
        caTier: CA_TIER;
        adTier: AD_TIER;
    };
    updatedAt: string;
    createdAt: string;
}

export const mongooseClient = getMongooseClient();
export const MemberSchema = new mongooseClient.Schema<IMember>({
    womID: { type: String, required: true },
    discordID: { type: String, required: true },
    currentCabbages: { type: Number, default: 0 },
    currentRank: { type: String, default: null },
    eventCabbages: { type: Number, default: 0 },
    accountProgression: {
        max: { type: Boolean, default: false },
        inferno: { type: Boolean, default: false },
        quiver: { type: Boolean, default: false },
        blorva: { type: Boolean, default: false },
        radiant: { type: Boolean, default: false },
        questCape: { type: Boolean, default: false },
        clogSlots: { type: Number, default: 0 },
        caTier: { type: String, default: null, uppercase: true }, // For example "GRANDMASTER"
        adTier: { type: String, default: null, uppercase: true }, // For example "MEDIUM"
    },
});

MemberSchema.set('timestamps', true);
export const Member = mongooseClient.model<IMember>('Member', MemberSchema);
