import * as Configuration from '../config.json';

type TemporaryRankConfig = {
    displayName: string;
    description: string;
    emojiName: string;
    fallbackEmoji: string;
};

const temporaryRanks = Configuration.temporaryRanks satisfies Record<
    string,
    TemporaryRankConfig
>;

export type TEMPORARY_RANK_TYPE = keyof typeof temporaryRanks;

export const TEMPORARY_RANKS = temporaryRanks;

export const TEMPORARY_RANK_TYPES = Object.keys(
    temporaryRanks
) as TEMPORARY_RANK_TYPE[];

export const isTemporaryRankType = (
    rankType: string
): rankType is TEMPORARY_RANK_TYPE => {
    return rankType in temporaryRanks;
};

export const getTemporaryRankDisplayName = (
    rankType: TEMPORARY_RANK_TYPE
): string => {
    return temporaryRanks[rankType].displayName;
};
