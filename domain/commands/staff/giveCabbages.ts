import { TextChannel, User } from 'discord.js';
import { Environment } from '../../../services/environment';
import { isStaffBasedOnUser } from '../../../services/isStaff';
import { IMember, Member } from '../../../stores';
import { updateMemberRank } from '../../../helpers/updateMemberRank';
import { findGuildEmoji } from '../../../services/emoji';

export const giveCabbages = async ({
    initiator,
    receiver,
    quantity,
    reason,
}: {
    initiator: User;
    receiver: User;
    quantity: number;
    reason?: string;
}) => {
    if (!isStaffBasedOnUser(initiator)) {
        throw new Error('You do not have permission to use this command.');
    }

    let memberData: IMember | null;
    try {
        memberData = await Member.findOne({
            discordID: receiver.id,
        });

        if (!memberData) {
            throw new Error('User is not registered.');
        }
    } catch (error) {
        console.error(
            'Error checking if discord ID is already registered: ',
            error
        );
        throw new Error('Something went wrong. Please try again.');
    }

    memberData.eventCabbages += quantity;
    await memberData.save();

    updateMemberRank(receiver.id, initiator.client).then(() => {
        const logChannel = initiator.client.channels.cache.get(
            Environment.LOG_CHANNEL_ID
        ) as TextChannel;

        if (logChannel) {
            const fields = [];
            if (reason) {
                fields.push({
                    name: 'Reason',
                    value: reason,
                });
            }

            logChannel.send({
                embeds: [
                    {
                        title: `${findGuildEmoji(initiator.client, 'cabbage')} Cabbages awarded`,
                        description: `${receiver} has been awarded \`${quantity}\` cabbages by ${initiator}`,
                        color: 0x5d811f,
                        fields,
                    },
                ],
            });
        }
    });

    return;
};
