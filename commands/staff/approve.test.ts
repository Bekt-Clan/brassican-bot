import { ChatInputCommandInteraction } from 'discord.js';
import type { Mock } from 'vitest';

import { execute } from './approve';
import { Member } from '../../models/member';

vi.mock('../../models/member');

describe('commands | staff | approve', () => {
    let interaction: ChatInputCommandInteraction;
    let accessMock: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        accessMock = vi.fn();
        interaction = {
            deferReply: vi.fn(),
            editReply: vi.fn(),
            options: {
                getUser: vi.fn().mockReturnValue({ id: '123' }),
            },
            member: {
                roles: {
                    cache: {
                        some: accessMock.mockReturnValue(true),
                    },
                },
            },
        } as unknown as ChatInputCommandInteraction;
    });

    test('When a user calls the command, then the command reply should be ephemeral', async () => {
        // Act
        await execute(interaction);

        // Assert
        expect(interaction.deferReply).toHaveBeenCalledWith({
            flags: 'Ephemeral',
        });
    });

    test('When a user is not a member of staff, then the command should exit with an appropriate message', async () => {
        // Arrange
        accessMock.mockReturnValue(false);

        // Act
        await execute(interaction);

        // Assert
        expect(interaction.editReply).toHaveBeenCalledWith(
            'Only members of staff can use this command!'
        );
    });

    test('When the member cannot be found, then the command should notify that the user is not registered', async () => {
        // Arrange
        (Member.findOne as Mock).mockResolvedValue(null);

        // Act
        await execute(interaction);

        // Assert
        expect(interaction.editReply).toHaveBeenCalledWith(
            'User is not registered!'
        );
    });
});
