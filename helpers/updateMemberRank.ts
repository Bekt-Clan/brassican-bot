import {
    ActionRowBuilder,
    ButtonBuilder,
    Client,
    TextChannel,
} from 'discord.js';
import { ButtonStyle } from 'discord-api-types/v10';

import { Environment } from '../services/environment';
import { mapPointsToRank } from './mapPointsToRank';
import { getCabbageBreakdown } from './calculateCabbages';
import { IMember, Member } from '../models/member';
import { getWOMClient } from '../config/wom';
import { PlayerDetails } from '@wise-old-man/utils';

export const updateMemberRank = async (
    memberDiscordId: string,
    discordClient: Client
) => {
    // TODO: Pull these out to another location
    const roleMap = {
        Jade: Environment.JADE_RANK_ID,
        'Red Topaz': Environment.RED_TOPAZ_RANK_ID,
        Sapphire: Environment.SAPPHIRE_RANK_ID,
        Emerald: Environment.EMERALD_RANK_ID,
        Ruby: Environment.RUBY_RANK_ID,
        Diamond: Environment.DIAMOND_RANK_ID,
        'Dragon Stone': Environment.DRAGON_STONE_RANK_ID,
        Onyx: Environment.ONYX_RANK_ID,
        Zenyte: Environment.ZENYTE_RANK_ID,
    } as { [key: string]: string };

    let memberData: IMember | null;
    let playerDetails: PlayerDetails | null;
    try {
        memberData = await Member.findOne({
            discordID: memberDiscordId,
        });

        if (!memberData) {
            console.error('Attempted to update unknown member!');
            return;
        }

        const womClient = getWOMClient();
        playerDetails = await womClient.players.getPlayerDetailsById(
            parseInt(memberData.womID, 10)
        );
    } catch (error) {
        console.error('Error getting user data for update: ', error);
        return;
    }

    const { data: latestSnapshotData } = playerDetails?.latestSnapshot || {};

    if (latestSnapshotData?.skills?.overall?.level === 2277) {
        memberData.accountProgression.max = true;
    }

    if ((latestSnapshotData?.bosses?.tzkal_zuk?.kills || 0) > 0) {
        memberData.accountProgression.inferno = true;
    }

    if ((latestSnapshotData?.bosses?.sol_heredit?.kills || 0) > 0) {
        memberData.accountProgression.quiver = true;
    }

    const amountOfCollectionLogs =
        latestSnapshotData?.activities?.collections_logged.score;

    if (amountOfCollectionLogs && amountOfCollectionLogs > 0) {
        memberData.accountProgression.clogSlots = amountOfCollectionLogs;
    }

    memberData.currentCabbages = Object.values(
        getCabbageBreakdown(memberData, playerDetails)
    ).reduce((acc, val) => acc + val, 0);

    let newRank = null;

    newRank = mapPointsToRank(memberData.currentCabbages);

    if (newRank !== memberData.currentRank) {
        memberData.currentRank = newRank;

        // Update member's discord role
        try {
            const discordGuild = await discordClient.guilds.fetch(
                Environment.GUILD_ID
            );
            const discordMember =
                await discordGuild.members.fetch(memberDiscordId);
            await discordMember.roles.remove(Object.values(roleMap));
            await discordMember.roles.add(roleMap[newRank]);

            // Log that user's discord rank was changed
            const logChannel = discordClient.channels.cache.get(
                Environment.LOG_CHANNEL_ID
            ) as TextChannel;

            logChannel.send(
                `<@${memberData.discordID}>'s rank was updated on Discord to: ${newRank}`
            );
        } catch (error) {
            console.error("Error updating user's roles: ", error);
        }

        // Create in-game rank update event
        const complete = new ButtonBuilder()
            .setCustomId('completeRankUpdate')
            .setLabel('Complete')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            complete
        );

        const rankUpdatesChannel = discordClient.channels.cache.get(
            Environment.RANK_UPDATES_CHANNEL
        ) as TextChannel;

        const RSN =
            playerDetails.displayName || playerDetails.username || 'unknown';

        rankUpdatesChannel.send({
            content: `<@${memberData.discordID}> (RSN: \`${RSN}\`) needs their rank in game updated to: ${newRank}`,
            components: [row],
        });
    }

    await memberData.save();
    return;
};
