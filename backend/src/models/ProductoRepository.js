import { Database } from '../config/Database.js';
import { Product } from './ProductoModel.js';

export class ProductRepository {
  static #instance = null;

  constructor() {
    if (ProductRepository.#instance) {
      return ProductRepository.#instance;
    }

    this.db = Database.getInstance().getPool();
    ProductRepository.#instance = this;
  }

  static getInstance() {
    if (!ProductRepository.#instance) {
      return new ProductRepository();
    }
    return ProductRepository.#instance;
  }

  #toProduct(row) {
    return new Product(row.id, row.nombre, row.categoria, row.pvp);
  }

  async countAll() {
    const [rows] = await this.db.query('SELECT COUNT(*) AS total FROM productos');
    return Number(rows[0].total);
  }

  async findPaginated(limit, offset) {
    const [rows] = await this.db.execute(
      'SELECT id, nombre, categoria, pvp FROM productos ORDER BY id ASC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );
    return rows.map((row) => this.#toProduct(row));
  }

  async findById(id) {
    const [rows] = await this.db.execute(
      'SELECT id, nombre, categoria, pvp FROM productos WHERE id = ?',
      [Number(id)]
    );
    return rows.length > 0 ? this.#toProduct(rows[0]) : null;
  }

  async create(productData) {
    const { nombre: productName, categoria: productCategory, pvp: productPrice } = productData;
    const [result] = await this.db.execute(
      'INSERT INTO productos (nombre, categoria, pvp) VALUES (?, ?, ?)',
      [productName, productCategory, productPrice]
    );
    return new Product(result.insertId, productName, productCategory, productPrice);
  }

  async update(id, updateData) {
    const { nombre: productName, categoria: productCategory, pvp: productPrice } = updateData;
    await this.db.execute(
      'UPDATE productos SET nombre = ?, categoria = ?, pvp = ? WHERE id = ?',
      [productName, productCategory, productPrice, Number(id)]
    );

    return this.findById(id);
  }

  async patch(id, partialData) {
    const columns = {
      nombre: 'nombre',
      categoria: 'categoria',
      pvp: 'pvp'
    };
    const fields = [];
    const values = [];

    for (const [key, column] of Object.entries(columns)) {
      if (partialData[key] !== undefined) {
        fields.push(`${column} = ?`);
        values.push(partialData[key]);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(Number(id));
    await this.db.execute(
      `UPDATE productos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id) {
    const [result] = await this.db.execute(
      'DELETE FROM productos WHERE id = ?',
      [Number(id)]
    );
    return result.affectedRows > 0;
  }
}

export { ProductRepository as ProductoRepository };
