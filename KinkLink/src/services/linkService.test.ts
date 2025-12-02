import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLink, acceptLink, unlinkCouple } from './linkService';
import { getDoc, runTransaction } from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: {
    currentUser: { uid: 'user123' }
  },
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => 'TIMESTAMP'),
  collection: vi.fn(),
}));

type MockedFunction = ReturnType<typeof vi.fn>;

describe('linkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLink', () => {
    it('should create a pending link with a 6-character code', async () => {
      const mockInitialUserDoc = {
        exists: () => true,
        data: () => ({ coupleId: null, partnerId: null }),
      };

      (getDoc as MockedFunction).mockResolvedValue(mockInitialUserDoc);

      const mockTransaction = {
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({ coupleId: null, partnerId: null }),
      };

      mockTransaction.get.mockResolvedValue(mockUserDoc);

      (runTransaction as MockedFunction).mockImplementation(async (_db, callback) => {
        return await callback(mockTransaction);
      });

      const result = await createLink();

      expect(result).toHaveLength(6);
      expect(result).toMatch(/^[A-Z0-9]{6}$/);
      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          initiatorUserId: 'user123',
          linkCode: result,
          status: 'pending',
          createdAt: 'TIMESTAMP',
        })
      );
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        { linkCode: result }
      );
    });

    it('should throw error if user is already linked', async () => {
      const mockInitialUserDoc = {
        exists: () => true,
        data: () => ({ coupleId: 'existing-couple', partnerId: 'partner123' }),
      };

      (getDoc as MockedFunction).mockResolvedValue(mockInitialUserDoc);

      await expect(createLink()).rejects.toThrow('Você já está vinculado a alguém');
    });
  });

  describe('acceptLink', () => {
    it('should complete linking atomically in a transaction', async () => {
      const mockTransaction = {
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };

      // Mock pendingLink exists
      const mockPendingLink = {
        exists: () => true,
        data: () => ({
          initiatorUserId: 'initiator123',
          linkCode: 'ABC123',
        }),
      };

      // Mock both users exist
      const mockInitiatorUser = {
        exists: () => true,
        data: () => ({ id: 'initiator123', partnerId: null }),
      };

      const mockAcceptorUser = {
        exists: () => true,
        data: () => ({ id: 'user123', partnerId: null }),
      };

      mockTransaction.get
        .mockResolvedValueOnce(mockPendingLink)
        .mockResolvedValueOnce(mockInitiatorUser)
        .mockResolvedValueOnce(mockAcceptorUser);

      (runTransaction as MockedFunction).mockImplementation(async (_db: unknown, callback: (t: typeof mockTransaction) => Promise<unknown>) => {
        return await callback(mockTransaction);
      });

      await acceptLink('ABC123');

      // Verify transaction operations
      expect(mockTransaction.get).toHaveBeenCalledTimes(3); // pendingLink + 2 users
      expect(mockTransaction.set).toHaveBeenCalledTimes(1); // couple creation
      expect(mockTransaction.update).toHaveBeenCalledTimes(2); // 2 user updates
      expect(mockTransaction.delete).toHaveBeenCalledTimes(1); // pendingLink deletion

      // Verify couple document structure
      const coupleSetCall = mockTransaction.set.mock.calls[0];
      expect(coupleSetCall[1]).toMatchObject({
        members: ['initiator123', 'user123'],
        memberSymbols: { initiator123: '★', user123: '▲' },
        createdAt: 'TIMESTAMP',
      });
    });

    it('should throw error if link code not found', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => false }),
      };

      (runTransaction as MockedFunction).mockImplementation(async (_db: unknown, callback: (t: typeof mockTransaction) => Promise<unknown>) => {
        return await callback(mockTransaction);
      });

      await expect(acceptLink('INVALID')).rejects.toThrow('Código de vínculo não encontrado');
    });

    it('should throw error if initiator user not found', async () => {
      const mockTransaction = {
        get: vi.fn()
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ initiatorUserId: 'ghost123' }),
          })
          .mockResolvedValueOnce({ exists: () => false }),
      };

      (runTransaction as MockedFunction).mockImplementation(async (_db: unknown, callback: (t: typeof mockTransaction) => Promise<unknown>) => {
        return await callback(mockTransaction);
      });

      await expect(acceptLink('ABC123')).rejects.toThrow('Usuário iniciador não encontrado');
    });

    it('should throw error if acceptor user not found', async () => {
      vi.mock('../firebase', () => ({
        auth: { currentUser: null },
        db: {}
      }));

      await expect(acceptLink('ABC123')).rejects.toThrow('Usuário não autenticado');
    });

    it('should throw error if initiator already has a partner', async () => {
      const mockTransaction = {
        get: vi.fn()
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ initiatorUserId: 'initiator123' }),
          })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ id: 'initiator123', partnerId: 'someone_else' }),
          }),
      };

      (runTransaction as MockedFunction).mockImplementation(async (_db: unknown, callback: (t: typeof mockTransaction) => Promise<unknown>) => {
        return await callback(mockTransaction);
      });

      await expect(acceptLink('ABC123')).rejects.toThrow('Usuário iniciador já tem um parceiro');
    });

    it('should throw error if acceptor already has a partner', async () => {
      const mockTransaction = {
        get: vi.fn()
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ initiatorUserId: 'initiator123' }),
          })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ id: 'initiator123', partnerId: null }),
          })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ id: 'user123', partnerId: 'someone_else' }),
          }),
      };

      (runTransaction as MockedFunction).mockImplementation(async (_db: unknown, callback: (t: typeof mockTransaction) => Promise<unknown>) => {
        return await callback(mockTransaction);
      });

      await expect(acceptLink('ABC123')).rejects.toThrow('Usuário aceitador já tem um parceiro');
    });
  });

  describe('unlinkCouple', () => {
    it('should unlink couple atomically in a transaction', async () => {
      const mockTransaction = {
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };

      const mockCouple = {
        exists: () => true,
        data: () => ({
          members: ['user123', 'partner456'],
        }),
      };

      mockTransaction.get.mockResolvedValue(mockCouple);

      (runTransaction as MockedFunction).mockImplementation(async (_db: unknown, callback: (t: typeof mockTransaction) => Promise<unknown>) => {
        return await callback(mockTransaction);
      });

      await unlinkCouple('couple789');

      // Verify transaction operations
      expect(mockTransaction.get).toHaveBeenCalledTimes(1);
      expect(mockTransaction.update).toHaveBeenCalledTimes(2); // Reset both users
      expect(mockTransaction.delete).toHaveBeenCalledTimes(1); // Delete couple

      // Verify user updates reset coupleId (partnerId não é mais usado)
      const user1Update = mockTransaction.update.mock.calls[0][1];
      const user2Update = mockTransaction.update.mock.calls[1][1];
      expect(user1Update).toMatchObject({ coupleId: null });
      expect(user2Update).toMatchObject({ coupleId: null });
    });

    it('should throw error if couple not found', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => false }),
      };

      (runTransaction as MockedFunction).mockImplementation(async (_db: unknown, callback: (t: typeof mockTransaction) => Promise<unknown>) => {
        return await callback(mockTransaction);
      });

      await expect(unlinkCouple('invalid')).rejects.toThrow('Casal não encontrado');
    });

    it('should throw error if user is not a member of the couple', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            members: ['otherUser1', 'otherUser2'],
          }),
        }),
      };

      (runTransaction as MockedFunction).mockImplementation(async (_db: unknown, callback: (t: typeof mockTransaction) => Promise<unknown>) => {
        return await callback(mockTransaction);
      });

      await expect(unlinkCouple('couple789')).rejects.toThrow('Você não é membro deste casal');
    });
  });
});
