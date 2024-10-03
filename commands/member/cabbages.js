const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const { getDiscordClient } = require('../../discord');
const {
    getCabbageBreakdown,
    cabbagesUntilNext,
} = require('../../helpers/calculateCabbages');
const models = require('../../models');

const findEmoji = (client, name) => {
    const emoji = client.emojis.cache.find(
        (emoji) => emoji.name.toLowerCase() === name.toLowerCase()
    );
    return emoji || '';
};

const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const pad = (input, spaces) => {
    // Make sure input is converted to a string
    const string = typeof input === 'string' ? input : input.toString();
    if (string.length == spaces) {
        return string;
    } else if (spaces - string.length == 1) {
        return pad(string + ' ', spaces);
    } else if (spaces - string.length >= 2) {
        return pad(' ' + string + ' ', spaces);
    } else {
        // string.length > spaces
        return ' '.repeat(spaces);
    }
};

const embedfield = (name, value, inline) => ({
    name: name || ' ',
    value: value || ' ',
    inline: inline || false,
});

const mobileBreakdown = (member, memberData) => {
    const client = getDiscordClient();
    const { accountProgression: account } = memberData;
    // Generate all neccesary info
    const rankEmojiName = `${memberData.currentRank
        .toLowerCase()
        .replace(/ /g, '')}Gem`;
    const rankEmoji = findEmoji(client, rankEmojiName);
    const cabbages = Math.floor(memberData.currentCabbages);
    const cabbageBreakdown = getCabbageBreakdown(memberData);
    const timestamp = Math.floor(Date.parse(memberData.updatedAt) / 1000);
    const nickname = capitalize(member.nickname);
    const nextTierAmount = cabbagesUntilNext(cabbages);
    const nextTierText = nextTierAmount > 0 ? nextTierAmount.toString() : 'N/A';
    // Generate text block
    const textArray = [
        `# ${rankEmoji}  ${nickname}'s profile`,
        ' ',
        `Current cabbages: ${cabbages}`,
        `Cabbages until next tier: ${nextTierText}`,
        `Last updated: <t:${timestamp}>\`\`\``,
        '╔══════════════╦════════╦══════════╗',
        '║ Achievements ║ Status ║ Cabbages ║',
        '╠══════════════╩════════╩══════════╣',
        `║   EHP + EHB  |        |${pad(cabbageBreakdown.core, 10)}║`,
    ];
    if (memberData.eventCabbages !== 0) {
        const eventCabbages = pad(cabbageBreakdown.eventCabbages, 10);
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║    Events    |        |${eventCabbages}║`);
    }
    if (account.max) {
        const maxedCabbages = pad(cabbageBreakdown.max, 10);
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║     Maxed    |   ok   |${maxedCabbages}║`);
    }
    if (account.inferno) {
        const infernoCabbages = pad(cabbageBreakdown.inferno, 10);
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║    Inferno   |   ok   |${infernoCabbages}║`);
    }
    if (account.quiver) {
        const quiverCabbages = pad(cabbageBreakdown.quiver, 10);
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║    Quiver    |   ok   |${quiverCabbages}║`);
    }
    if (account.blorva) {
        const blorvaCabbages = pad(cabbageBreakdown.blorva, 10);
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║    Blorva    |   ok   |${blorvaCabbages}║`);
    }
    if (account.questCape) {
        const qpcCabbages = pad(cabbageBreakdown.questCape, 10);
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║  Quest Cape  |   ok   |${qpcCabbages}║`);
    }
    if (account.adTier) {
        const adCabbages = pad(cabbageBreakdown.adTier, 10);
        const adTier = pad(account.adTier, 8);
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║     AD's     |${adTier}|${adCabbages}║`);
    }
    if (account.caTier) {
        const caCabbages = pad(cabbageBreakdown.caTier, 10);
        const caTier = pad(
            account.caTier === 'GRANDMASTER' ? 'GM' : account.caTier,
            8
        );
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║     CA's     |${caTier}|${caCabbages}║`);
    }
    if (account.clogSlots > 0) {
        const clogCabbages = pad(cabbageBreakdown.clogSlots, 10);
        const clogAmount = pad(account.clogSlots, 8);
        textArray.push('╠--------------+--------+----------╣');
        textArray.push(`║  Clog slots  |${clogAmount}|${clogCabbages}║`);
    }
    textArray.push('╚══════════════════════════════════╝```');
    return textArray.join('\n');
};

const cabbageEmbed = (member, memberData) => {
    const client = getDiscordClient();
    const { accountProgression: account } = memberData;
    // Generate all neccesary info
    const checkmark = findEmoji(client, 'check');
    const rankEmojiName = `${memberData.currentRank
        .toLowerCase()
        .replace(/ /g, '')}Gem`;
    const rankEmoji = findEmoji(client, rankEmojiName);
    const cabbages = Math.floor(memberData.currentCabbages);
    const cabbageBreakdown = getCabbageBreakdown(memberData);
    const timestamp = Math.floor(Date.parse(memberData.updatedAt) / 1000);
    // Generate embed fields
    const achievementText = [];
    const statusText = [];
    const cabbagesText = [];
    // TODO: Do all these if-statements in a loop, info like achievement text,
    // emojiname, statustext will have to be saved elsewhere
    const cabbageEmoji = findEmoji(client, 'cabbageclassic');
    achievementText.push(`${cabbageEmoji} EHP + EHB`);
    statusText.push('-');
    cabbagesText.push(cabbageBreakdown.core);
    if (memberData.eventCabbages !== 0) {
        const bingoEmoji = findEmoji(client, 'bingo');
        achievementText.push(`${bingoEmoji} Events`);
        statusText.push('-');
        cabbagesText.push(memberData.eventCabbages);
    }
    if (account.max) {
        const maxEmoji = findEmoji(client, 'maxcape');
        achievementText.push(`${maxEmoji} Maxed`);
        statusText.push(checkmark);
        cabbagesText.push(cabbageBreakdown.max);
    }
    if (account.inferno) {
        const infernoEmoji = findEmoji(client, 'infernocape');
        achievementText.push(`${infernoEmoji} Inferno`);
        statusText.push(checkmark);
        cabbagesText.push(cabbageBreakdown.inferno);
    }
    if (account.quiver) {
        const quiverEmoji = findEmoji(client, 'quiver');
        achievementText.push(`${quiverEmoji} Quiver`);
        statusText.push(checkmark);
        cabbagesText.push(cabbageBreakdown.quiver);
    }
    if (account.blorva) {
        const blorvaEmoji = findEmoji(client, 'uwuemoji');
        achievementText.push(`${blorvaEmoji} Blorva`);
        statusText.push(checkmark);
        cabbagesText.push(cabbageBreakdown.blorva);
    }
    if (account.questCape) {
        const qpcEmoji = findEmoji(client, 'questpoint');
        achievementText.push(`${qpcEmoji} Quest Cape`);
        statusText.push(checkmark);
        cabbagesText.push(cabbageBreakdown.questCape);
    }
    if (account.adTier) {
        const adTierEmoji = findEmoji(client, 'achievement_diaries');
        achievementText.push(`${adTierEmoji} AD's`);
        statusText.push(capitalize(account.adTier));
        cabbagesText.push(cabbageBreakdown.adTier);
    }
    if (account.caTier) {
        const caTierEmoji = findEmoji(client, 'combat_achievements');
        achievementText.push(`${caTierEmoji} CA's`);
        statusText.push(capitalize(account.caTier));
        cabbagesText.push(cabbageBreakdown.caTier);
    }
    if (account.clogSlots > 0) {
        const clogEmoji = findEmoji(client, 'collection_log');
        achievementText.push(`${clogEmoji} Clog slots`);
        statusText.push(account.clogSlots);
        cabbagesText.push(cabbageBreakdown.clogSlots);
    }
    // Generate embed
    const nickname = capitalize(member.nickname);
    const nextTierAmount = cabbagesUntilNext(cabbages);
    const nextTierText = nextTierAmount > 0 ? nextTierAmount.toString() : 'N/A';
    const embed = new EmbedBuilder()
        .addFields(
            embedfield(`${rankEmoji}  **${nickname}'s profile**`, ''),
            embedfield('', '**Current cabbages**:\n**Until next tier**:', true),
            embedfield('', `${cabbages}\n${nextTierText}`, true),
            embedfield('', '', true),
            embedfield('Achievements', achievementText.join('\n'), true),
            embedfield('Status', statusText.join('\n'), true),
            embedfield('Cabbages', cabbagesText.join('\n'), true),
            embedfield('', `**Last updated**: <t:${timestamp}>`)
        )
        .setColor('#11ff00')
        .setFooter({
            text: 'Brassican Bot',
            iconURL:
                'https://cdn.discordapp.com/avatars/1142496380343038108/8744d1e6497ef337b6a1a04c88148b2a.webp',
        })
        .setTimestamp();
    return embed;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cabbages')
        .setDescription('Get your current cabbage count!')
        .addUserOption((option) =>
            option
                .setName('member')
                .setDescription(
                    'The member you want to see the cabbage count of'
                )
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const member =
            interaction?.options?.getMember('member') || interaction.member;
        const discordID = member.id;

        // Get user's information
        let memberData;
        try {
            memberData = await models.Member.findOne({
                discordID: discordID,
            });

            if (!memberData) {
                await interaction.editReply(
                    "You aren't registered yet. Use `/register` to get signed up!"
                );
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

        const button = new ButtonBuilder()
            .setCustomId('mobileCabbageBreakdown')
            .setLabel('Show mobile version?')
            .setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(button);

        const reply = await interaction.editReply({
            embeds: [cabbageEmbed(member, memberData)],
            components: [row],
        });

        const collector = reply.createMessageComponentCollector({
            ComponentType: ComponentType.Button,
            time: 60_000, // only wait for 60s
        });

        collector.on('collect', async (button) => {
            await interaction.editReply({
                content: mobileBreakdown(member, memberData),
                embeds: [],
                components: [],
            });
        });

        return;
    },
};
