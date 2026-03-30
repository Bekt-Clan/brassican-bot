import { GuildMember, Role } from 'discord.js';

import { Environment } from '../services/environment';

export const isStaff = (member: GuildMember): boolean => {
    return member.roles.cache.some(
        (role: Role) =>
            role.id === Environment.DISCORD_MOD_ROLE_ID ||
            role.id === Environment.DISCORD_CA_ROLE_ID ||
            role.id === Environment.DISCORD_ADMIN_ROLE_ID
    );
};
