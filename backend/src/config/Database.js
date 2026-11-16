import mysql from 'mysql2/promise';
import { settings } from './settings.js';

export class Database {
  static #instance = null;
  #pool;

  constructor() {
    if (Database.#instance) {
      return Database.#instance;
    }

    this.#pool = mysql.createPool({
      host: settings.database.host,
      port: settings.database.port,
      user: settings.database.user,
      password: settings.database.password,
      database: settings.database.name,
      waitForConnections: true,
      connectionLimit: settings.database.connectionLimit,
      queueLimit: settings.database.queueLimit,
      enableKeepAlive: settings.database.enableKeepAlive,
      keepAliveInitialDelay: settings.database.keepAliveInitialDelay
    });

    Database.#instance = this;
  }

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }
    return Database.#instance;
  }

  getPool() {
    return this.#pool;
  }

  async testConnection() {
    let connection;
    try {
      connection = await this.#pool.getConnection();
      console.log('[MySQL] Conexión establecida con éxito al pool.');
    } catch (error) {
      console.error('[MySQL] No se pudo conectar a la base de datos:', error.message);
      throw error;
    } finally {
      connection?.release();
    }
  }
}
