import {
    ChatInputCommandInteraction,
    TextChannel,
    SlashCommandBuilder,
} from 'discord.js';

import { Environment } from '../../services/environment';
import { Member } from '../../models/member';
import { getWOMClient } from '../../config/wom';
import { updateMemberRank } from '../../helpers/updateMemberRank';

export const data = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register for the Bekt clan rank system!')
    .addStringOption((option) =>
        option
            .setName('rsn')
            .setDescription(
                'The current account name of your main OSRS account'
            )
            .setRequired(true)
    );

export const execute = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ flags: 'Ephemeral' });
    const rsn = interaction.options.getString('rsn')!;
    const discordID = interaction.user.id;

    // Check if user is already registered with this discord ID
    try {
        const memberFromDiscordID = await Member.findOne({
            discordID: discordID,
        });

        if (memberFromDiscordID) {
            await interaction.editReply('You are already registered!');
            return;
        }
    } catch (error) {
        console.error(
            'Error checking if discord ID is already registered: ',
            error
        );
        await interaction.editReply('Something went wrong. Please try again.');
        return;
    }

    // Get user info from WOM
    let womResult;
    try {
        const womClient = getWOMClient();
        womResult = await womClient.players.getPlayerDetails(rsn);
    } catch (error) {
        if (error instanceof Error && error.name === 'NotFoundError') {
            const womWebsite = `https://wiseoldman.net/players/${rsn}`;
            const reply =
                "Unable to register with this RSN as it hasn't been tracked yet by Wise Old Man. " +
                `Please visit [this page](${womWebsite}) to start tracking your account. ` +
                'After that, run the `/register` command again.';
            await interaction.editReply(reply);
            return;
        }

        console.error('Error getting user WOM entry: ', error);
        await interaction.editReply('Something went wrong. Please try again.');
        return;
    }

    // Check if user is already registered with this WOM ID
    try {
        const memberFromWOMID = await Member.findOne({
            womID: womResult.id.toString(),
        });

        if (memberFromWOMID) {
            await interaction.editReply(
                'The given RSN is already registered with another member!'
            );
            return;
        }
    } catch (error) {
        console.error(
            'Error checking if wom ID is already registered: ',
            error
        );
        await interaction.editReply('Something went wrong. Please try again.');
        return;
    }

    const newMember = new Member({
        womID: womResult.id,
        discordID: discordID,
    });

    await newMember.save();
    await interaction.editReply(
        "You're all set! Keep an eye out for your new rank to be applied soon!"
    );

    updateMemberRank(discordID, interaction.client);

    // Send log message that user was registered
    const logChannel = interaction.client.channels.cache.get(
        Environment.LOG_CHANNEL_ID
    ) as TextChannel;

    logChannel.send(
        `${interaction.member?.toString()} has registered for the rank system using the RSN: \`${rsn}\``
    );

    return;
};
