import * as z from 'zod';
import { User } from 'discord.js';

export const GiveCabbagesCommandOptionsSchema = z.object({
    user: z.custom<User>(),
    quantity: z.number(),
    reason: z.string().optional(),
});

export type GiveCabbagesCommandOptions = z.infer<
    typeof GiveCabbagesCommandOptionsSchema
>;
