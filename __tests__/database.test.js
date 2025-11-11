// Mock mysql2/promise BEFORE importing database module
const mockConnection = {
  release: jest.fn(),
  beginTransaction: jest.fn(),
  execute: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn()
};

const mockPool = {
  getConnection: jest.fn().mockResolvedValue(mockConnection),
  execute: jest.fn()
};

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => mockPool)
}));

jest.mock('../src/utils/logger');

// Import after mocking
const { pool, testConnection, executeQuery, beginTransaction, dbConfig } = require('../src/config/database');
const logger = require('../src/utils/logger');

describe('Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection.release.mockClear();
    mockConnection.beginTransaction.mockClear();
    mockConnection.execute.mockClear();
    mockPool.getConnection.mockClear().mockResolvedValue(mockConnection);
    mockPool.execute.mockClear();
  });

  describe('dbConfig', () => {
    test('has correct default configuration', () => {
      expect(dbConfig).toMatchObject({
        host: expect.any(String),
        user: expect.any(String),
        password: expect.any(String),
        database: expect.any(String),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });
    });
  });

  describe('pool', () => {
    test('is initialized', () => {
      expect(pool).toBeDefined();
    });
  });

  describe('testConnection', () => {
    test('successfully establishes connection', async () => {
      const result = await testConnection();

      expect(result).toBe(true);
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database connection established successfully');
    });

    test('handles connection failure', async () => {
      const error = new Error('Connection failed');
      mockPool.getConnection.mockRejectedValueOnce(error);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Database connection failed:', error);
    });
  });

  describe('executeQuery', () => {
    test('executes query successfully', async () => {
      const mockResults = [{ id: 1, name: 'Test' }];
      mockPool.execute.mockResolvedValueOnce([mockResults]);

      const query = 'SELECT * FROM test WHERE id = ?';
      const params = [1];

      const results = await executeQuery(query, params);

      expect(results).toEqual(mockResults);
      expect(mockPool.execute).toHaveBeenCalledWith(query, params);
    });

    test('executes query without params', async () => {
      const mockResults = [{ count: 5 }];
      mockPool.execute.mockResolvedValueOnce([mockResults]);

      const query = 'SELECT COUNT(*) as count FROM test';

      const results = await executeQuery(query);

      expect(results).toEqual(mockResults);
      expect(mockPool.execute).toHaveBeenCalledWith(query, []);
    });

    test('handles query execution error', async () => {
      const error = new Error('Query failed');
      mockPool.execute.mockRejectedValueOnce(error);

      const query = 'SELECT * FROM invalid_table';
      const params = ['test'];

      await expect(executeQuery(query, params)).rejects.toThrow('Query failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Database query error:',
        expect.objectContaining({
          query,
          params,
          error: 'Query failed'
        })
      );
    });
  });

  describe('beginTransaction', () => {
    test('begins transaction successfully', async () => {
      const connection = await beginTransaction();

      expect(connection).toBe(mockConnection);
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
    });

    test('handles transaction start failure', async () => {
      const error = new Error('Transaction start failed');
      mockPool.getConnection.mockRejectedValueOnce(error);

      await expect(beginTransaction()).rejects.toThrow('Transaction start failed');
    });

    test('handles beginTransaction method failure', async () => {
      const error = new Error('Begin transaction failed');
      mockConnection.beginTransaction.mockRejectedValueOnce(error);

      await expect(beginTransaction()).rejects.toThrow('Begin transaction failed');
    });
  });
});
