import mongoose from 'mongoose';

export const up = async (db: mongoose.mongo.Db) => {
    await db.collection('members').updateMany(
        { 'accountProgression.radiant': { $exists: false } },
        {
            $set: { 'accountProgression.radiant': false },
        }
    );
};

export const down = async (db: mongoose.mongo.Db) => {
    await db.collection('members').updateMany(
        {},
        {
            $unset: { 'accountProgression.radiant': '' },
        }
    );
};
