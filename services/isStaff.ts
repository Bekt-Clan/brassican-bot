import { GuildMember, Role, User } from 'discord.js';
import { Environment } from './environment';

export const isStaff = (user: GuildMember) => {
    return user.roles.cache.some(
        (role: Role) =>
            role.id === Environment.DISCORD_MOD_ROLE_ID ||
            role.id === Environment.DISCORD_CA_ROLE_ID
    );
};

export const isStaffBasedOnUser = (user: User) => {
    const userGuild = user.client.guilds.cache.get(Environment.GUILD_ID);

    if (!userGuild) {
        throw new Error('Guild not found');
    }

    const initiatorMember = userGuild?.members.cache.get(user.id);
    if (!initiatorMember) {
        throw new Error('Member not found');
    }

    return initiatorMember?.roles.cache.some(
        (role) =>
            role.id === Environment.DISCORD_MOD_ROLE_ID ||
            role.id === Environment.DISCORD_CA_ROLE_ID
    );
};
