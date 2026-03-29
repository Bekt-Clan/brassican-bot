import * as schedule from 'node-schedule';

const jobs = new Map<string, schedule.Job>();

export const addJob = (id: string, job: schedule.Job): void => {
    jobs.set(id, job);
};

export const removeJob = (id: string): void => {
    const job = jobs.get(id);
    if (job) {
        job.cancel();
        jobs.delete(id);
    }
};
