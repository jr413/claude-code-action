import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
  max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
});

pool.on('connect', () => {
  logger.debug('Database client connected');
});

pool.on('acquire', () => {
  logger.debug('Database client acquired');
});

pool.on('remove', () => {
  logger.debug('Database client removed');
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', {
      text,
      duration,
      rows: res.rowCount,
    });
    return res;
  } catch (error) {
    logger.error('Database query error', {
      text,
      error,
    });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = () => {
    client.release();
  };

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    logger.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  return {
    query,
    release: () => {
      clearTimeout(timeout);
      release();
    },
  };
};

export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};