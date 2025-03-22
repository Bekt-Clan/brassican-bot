import * as z from 'zod';
import { GuildMember } from 'discord.js';

export const cabbageCommandParameterSchema = z
    .object({
        member: z.custom<GuildMember>().optional(),
    })
    .strict();

export type CabbageCommandParameters = z.infer<
    typeof cabbageCommandParameterSchema
>;
