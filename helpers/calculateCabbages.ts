import { PlayerDetailsResponse } from '@wise-old-man/utils';
import * as Configuration from '../config.json';
import { IMember } from '../models/member';

export const getCabbageBreakdown = (
    memberData: IMember,
    playerDetails?: PlayerDetailsResponse
) => {
    const configCabbages = Configuration.cabbages;

    // We return an object with key-value pairs (<achievement-name>, <amount of cabbages>)
    // If playerDetails is undefined or not provided, we reverse engineer the core cabbages
    const { accountProgression: account } = memberData;
    let clogCabbages =
        Math.floor(account.clogSlots / configCabbages.clog.frequency) *
        configCabbages.clog.amount;

    (configCabbages.clog.bonus || []).forEach(({ milestone, amount }) => {
        if (account.clogSlots >= milestone) clogCabbages += amount;
    });

    const cabbageBreakdown = {
        eventCabbages: memberData.eventCabbages || 0,
        max: account.max ? configCabbages.max : 0,
        inferno: account.inferno ? configCabbages.inferno : 0,
        quiver: account.quiver ? configCabbages.quiver : 0,
        blorva: account.blorva ? configCabbages.blorva : 0,
        radiant: account.radiant ? configCabbages.radiant : 0,
        questCape: account.questCape ? configCabbages.questCape : 0,
        clogSlots: clogCabbages || 0,
        caTier: configCabbages.ca[account.caTier] || 0,
        adTier: configCabbages.ad[account.adTier] || 0,
    } as { [key: string]: number };

    const sum = Object.values(cabbageBreakdown).reduce(
        (acc, val) => acc + val,
        0
    );

    cabbageBreakdown.core =
        playerDetails === undefined
            ? memberData.currentCabbages - sum
            : playerDetails.ehp + playerDetails.ehb;

    cabbageBreakdown.core = Math.floor(cabbageBreakdown.core);
    return cabbageBreakdown;
};

export const cabbagesUntilNext = (currentAmount: number) => {
    for (const threshold of Configuration.rankCutoffs) {
        if (threshold > currentAmount) return threshold - currentAmount;
    }

    return -1; // More cabbages than highest rank
};
