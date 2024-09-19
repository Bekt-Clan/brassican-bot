const { SlashCommandBuilder } = require('discord.js');

const { Configuration } = require('../../services/configuration');
const models = require('../../models');
const updateMemberRank = require('../../helpers/updateMemberRank.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('givecabbages')
        .setDescription('[STAFF ONLY] Give a user bonus cabbages!')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('The member to give cabbages to')
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName('quantity')
                .setDescription('The number of cabbages to give')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('cause of given cabbages')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Check if calling user is a member of staff (mod or CA)
        if (
            !interaction.member.roles.cache.some(
                (role) =>
                    role.id == Configuration.DISCORD_MOD_ROLE_ID ||
                    role.id == Configuration.DISCORD_CA_ROLE_ID
            )
        ) {
            await interaction.editReply(
                'Only members of staff can use this command!'
            );
            return;
        }

        const discordID = interaction.options.getUser('user').id;

        // Check if user is already registered with this discord ID
        let memberData;
        try {
            memberData = await models.Member.findOne({
                discordID: discordID,
            });

            if (!memberData) {
                await interaction.editReply('User is not registered!');
                return;
            }
        } catch (error) {
            console.error(
                'Error checking if discord ID is already registered: ',
                error
            );
            await interaction.editReply(
                'Something went wrong. Please try again.'
            );
            return;
        }

        memberData.eventCabbages += interaction.options.getInteger('quantity');

        await memberData.save();

        await interaction.editReply(
            `${interaction.options
                .getUser('user')
                .toString()} has been awarded ${interaction.options.getInteger(
                'quantity'
            )} cabbages! `
        );

        updateMemberRank(discordID, interaction.client);

        // Send log message
        const logChannel = interaction.client.channels.cache.get(
            Configuration.LOG_CHANNEL_ID
        );

        const userName = interaction.options.getUser('user').toString();
        const amount = interaction.options.getInteger('quantity');
        const approvingMod = interaction.member.toString();
        let reason = interaction.options.getString('reason');
        if (reason == null) {
            reason = 'with no reason given';
        } else {
            reason = 'with reason: ' + reason;
        }
        logChannel.send(
            `${userName} has been awarded ${amount} cabbages by ${approvingMod} ${reason}`
        );
        return;
    },
};
