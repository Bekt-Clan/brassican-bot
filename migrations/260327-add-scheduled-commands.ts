import mongoose from 'mongoose';

export const up = async (db: mongoose.mongo.Db) => {
    await db.createCollection('scheduled_commands');

    await db.collection('scheduled_commands').createIndex({ executeAt: 1 });
    await db.collection('scheduled_commands').createIndex({ discordID: 1 });
    await db.collection('scheduled_commands').createIndex({ createdBy: 1 });
};

export const down = async (db: mongoose.mongo.Db) => {
    await db.collection('scheduled_commands').drop();
};
