import { getWOMClient } from '../config/wom';

export const getRsnByWomId = async (womId: string): Promise<string | null> => {
    const womClient = getWOMClient();

    try {
        const playerDetails = await womClient.players.getPlayerDetailsById(
            parseInt(womId, 10)
        );
        return playerDetails.displayName || playerDetails.username || null;
    } catch (error) {
        console.error(`Error fetching RSN for WOM ID ${womId}:`, error);
        return null;
    }
};
