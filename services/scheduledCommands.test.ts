import { faker } from '@faker-js/faker';
import { Client, TextChannel } from 'discord.js';
import type { Mock } from 'vitest';

import { Member } from '../models/member';
import { ScheduledCommand } from '../models/scheduledCommand';
import { getWOMClient } from '../config/wom';
import { mapPointsToRank } from '../helpers/mapPointsToRank';
import {
    checkScheduledCommands,
    cancelScheduledCommand,
    getActiveScheduledCommands,
    addTemporaryRank,
} from './scheduledCommands';

vi.mock('../models/member');
vi.mock('../models/scheduledCommand');
vi.mock('../config/wom');
vi.mock('../helpers/mapPointsToRank');
vi.mock('../services/environment', () => ({
    Environment: {
        RANK_UPDATES_CHANNEL: 'test-channel-id',
    },
}));

describe('services | scheduledCommands', () => {
    let discordClient: Client;
    let mockChannel: TextChannel;

    beforeEach(() => {
        vi.clearAllMocks();

        mockChannel = {
            send: vi.fn(),
        } as unknown as TextChannel;

        discordClient = {
            channels: {
                cache: {
                    get: vi.fn().mockReturnValue(mockChannel),
                },
            },
        } as unknown as Client;

        (mapPointsToRank as Mock).mockReturnValue('Ruby');
    });

    describe('checkScheduledCommands', () => {
        test('When there are no scheduled commands ready, then no commands should be executed', async () => {
            // Arrange
            (ScheduledCommand.find as Mock).mockReturnValue([]);

            // Act
            await checkScheduledCommands(discordClient);

            // Assert
            expect(ScheduledCommand.find).toHaveBeenCalledWith({
                executeAt: { $lte: expect.any(Date) },
            });
            expect(ScheduledCommand.findByIdAndDelete).not.toHaveBeenCalled();
        });

        test('When there are scheduled commands ready, then they should be executed and deleted', async () => {
            // Arrange
            const mockCommands = [
                {
                    _id: 'command-1',
                    type: 'TEMPORARY_RANK',
                    rankType: 'INFERNAL_CAPE',
                    discordID: '123',
                    executeAt: new Date(Date.now() - 1000),
                },
                {
                    _id: 'command-2',
                    type: 'TEMPORARY_RANK',
                    rankType: 'MAX_CAPE',
                    discordID: '456',
                    executeAt: new Date(Date.now() - 2000),
                },
            ];

            (ScheduledCommand.find as Mock).mockReturnValue(mockCommands);
            (Member.findOne as Mock).mockResolvedValue({
                discordID: '123',
                womID: '789',
                currentCabbages: 1000,
            });
            (getWOMClient as Mock).mockReturnValue({
                players: {
                    getPlayerDetailsById: vi.fn().mockResolvedValue({
                        displayName: 'TestPlayer',
                    }),
                },
            });

            // Act
            await checkScheduledCommands(discordClient);

            // Assert
            expect(ScheduledCommand.findByIdAndDelete).toHaveBeenCalledTimes(2);
            expect(ScheduledCommand.findByIdAndDelete).toHaveBeenCalledWith(
                'command-1'
            );
            expect(ScheduledCommand.findByIdAndDelete).toHaveBeenCalledWith(
                'command-2'
            );
        });

        test('When executing a temporary rank command, then removal notification should be sent', async () => {
            // Arrange
            const mockCommand = {
                _id: 'command-1',
                type: 'TEMPORARY_RANK',
                rankType: 'INFERNAL_CAPE',
                discordID: '123',
                executeAt: new Date(Date.now() - 1000),
            };

            (ScheduledCommand.find as Mock).mockReturnValue([mockCommand]);
            (Member.findOne as Mock).mockResolvedValue({
                discordID: '123',
                womID: '789',
                currentCabbages: 1000,
            });
            (getWOMClient as Mock).mockReturnValue({
                players: {
                    getPlayerDetailsById: vi.fn().mockResolvedValue({
                        displayName: 'TestPlayer',
                    }),
                },
            });

            // Act
            await checkScheduledCommands(discordClient);

            // Assert
            expect(mockChannel.send).toHaveBeenCalledWith({
                content: expect.stringContaining('TestPlayer'),
                components: expect.any(Array),
            });
            expect(mockChannel.send).toHaveBeenCalledWith({
                content: expect.stringContaining('Ruby'),
                components: expect.any(Array),
            });
        });
    });

    describe('cancelScheduledCommand', () => {
        test('When cancelling an existing scheduled command, then it should be deleted and return true', async () => {
            // Arrange
            const commandId = 'command-123';
            (ScheduledCommand.findByIdAndDelete as Mock).mockResolvedValue({
                _id: commandId,
            });

            // Act
            const result = await cancelScheduledCommand(commandId);

            // Assert
            expect(ScheduledCommand.findByIdAndDelete).toHaveBeenCalledWith(
                commandId
            );
            expect(result).toBe(true);
        });

        test('When cancelling a non-existent scheduled command, then it should return false', async () => {
            // Arrange
            const commandId = 'non-existent';
            (ScheduledCommand.findByIdAndDelete as Mock).mockResolvedValue(
                null
            );

            // Act
            const result = await cancelScheduledCommand(commandId);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('getActiveScheduledCommands', () => {
        test('When getting active commands, then only future commands should be returned', async () => {
            // Arrange
            const mockCommands = [
                {
                    _id: 'command-1',
                    executeAt: new Date(Date.now() + 10000),
                },
                {
                    _id: 'command-2',
                    executeAt: new Date(Date.now() + 20000),
                },
            ];

            const mockSort = vi.fn().mockReturnValue(mockCommands);
            (ScheduledCommand.find as Mock).mockReturnValue({
                sort: mockSort,
            });

            // Act
            const result = await getActiveScheduledCommands();

            // Assert
            expect(ScheduledCommand.find).toHaveBeenCalledWith({
                executeAt: { $gt: expect.any(Date) },
            });
            expect(mockSort).toHaveBeenCalledWith({ executeAt: 1 });
            expect(result).toEqual(mockCommands);
        });
    });

    describe('addTemporaryRank', () => {
        test('When adding a temporary rank, then a scheduled command should be created', async () => {
            // Arrange
            const discordID = faker.string.numeric(10);
            const rankType = 'INFERNAL_CAPE';
            const durationDays = 14;
            const createdBy = faker.string.numeric(10);

            const mockMember = {
                discordID,
                womID: '789',
                currentCabbages: 1000,
            };

            const mockSave = vi.fn().mockResolvedValue({
                _id: 'new-command-id',
            });

            const mockScheduledCommand = {
                save: mockSave,
                _id: 'new-command-id',
            };

            (Member.findOne as Mock).mockResolvedValue(mockMember);
            (getWOMClient as Mock).mockReturnValue({
                players: {
                    getPlayerDetailsById: vi.fn().mockResolvedValue({
                        displayName: 'TestPlayer',
                    }),
                },
            });

            vi.mocked(ScheduledCommand).mockImplementation(
                function constructor() {
                    return mockScheduledCommand;
                }
            );

            // Act
            await addTemporaryRank(
                discordID,
                rankType,
                durationDays,
                createdBy,
                discordClient
            );

            // Assert
            expect(Member.findOne).toHaveBeenCalledWith({ discordID });
            expect(mockSave).toHaveBeenCalled();
            expect(mockChannel.send).toHaveBeenCalledWith({
                content: expect.stringContaining('TestPlayer'),
                components: expect.any(Array),
            });
            expect(mockChannel.send).toHaveBeenCalledWith({
                content: expect.stringContaining('Infernal Cape'),
                components: expect.any(Array),
            });
        });

        test('When adding a temporary rank for non-existent member, then an error should be thrown', async () => {
            // Arrange
            const discordID = faker.string.numeric(10);
            (Member.findOne as Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(
                addTemporaryRank(
                    discordID,
                    'INFERNAL_CAPE',
                    14,
                    'creator-123',
                    discordClient
                )
            ).rejects.toThrow('Member not found');
        });

        test('When adding a max cape temporary rank, then the notification should include correct rank name', async () => {
            // Arrange
            const discordID = faker.string.numeric(10);
            const rankType = 'MAX_CAPE';
            const durationDays = 14;

            (Member.findOne as Mock).mockResolvedValue({
                discordID,
                womID: '789',
            });

            (getWOMClient as Mock).mockReturnValue({
                players: {
                    getPlayerDetailsById: vi.fn().mockResolvedValue({
                        displayName: 'MaxedPlayer',
                    }),
                },
            });

            vi.mocked(ScheduledCommand).mockImplementation(
                function constructor() {
                    return {
                        save: vi.fn(),
                        _id: 'command-id',
                    };
                }
            );

            // Act
            await addTemporaryRank(
                discordID,
                rankType,
                durationDays,
                'creator-123',
                discordClient
            );

            // Assert
            expect(mockChannel.send).toHaveBeenCalledWith({
                content: expect.stringContaining('Max Cape'),
                components: expect.any(Array),
            });
        });

        test('When duration is 1 day, then singular form should be used in notification', async () => {
            // Arrange
            const discordID = faker.string.numeric(10);
            const durationDays = 1;

            (Member.findOne as Mock).mockResolvedValue({
                discordID,
                womID: '789',
            });

            (getWOMClient as Mock).mockReturnValue({
                players: {
                    getPlayerDetailsById: vi.fn().mockResolvedValue({
                        displayName: 'TestPlayer',
                    }),
                },
            });

            vi.mocked(ScheduledCommand).mockImplementation(
                function constructor() {
                    return {
                        save: vi.fn(),
                        _id: 'command-id',
                    };
                }
            );

            // Act
            await addTemporaryRank(
                discordID,
                'CABBAGE_RANK',
                durationDays,
                'creator-123',
                discordClient
            );

            // Assert
            expect(mockChannel.send).toHaveBeenCalledWith({
                content: expect.stringContaining('1 day)'),
                components: expect.any(Array),
            });
        });
    });
});
