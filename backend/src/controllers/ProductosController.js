import { ProductRepository } from '../models/ProductoRepository.js';

export class ProductsController {
  constructor() {
    this.repository = ProductRepository.getInstance();
  }

  getAll = async (req, res, next) => {
    try {
      const { page, limit, offset } = req.pagination;
      const [total, items] = await Promise.all([
        this.repository.countAll(),
        this.repository.findPaginated(limit, offset)
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      const statusCode = total > limit ? 206 : 200;

      return res.status(statusCode).json({
        meta: {
          totalRecords: total,
          currentPage: page,
          pageSize: limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        data: items
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await this.repository.findById(id);

      if (!item) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: `Producto con ID ${id} no encontrado.`
        });
      }

      return res.status(200).json({ data: item });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const { nombre: productName, categoria: productCategory, pvp: productPrice } = req.body;
      const newProduct = await this.repository.create({
        nombre: productName,
        categoria: productCategory,
        pvp: Number(productPrice)
      });

      return res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Producto creado exitosamente.',
        data: newProduct
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nombre: productName, categoria: productCategory, pvp: productPrice } = req.body;
      const updatedProduct = await this.repository.update(id, {
        nombre: productName,
        categoria: productCategory,
        pvp: Number(productPrice)
      });

      if (!updatedProduct) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: `Producto con ID ${id} no encontrado para actualizar.`
        });
      }

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Producto reemplazado completamente (PUT).',
        data: updatedProduct
      });
    } catch (error) {
      next(error);
    }
  };

  patch = async (req, res, next) => {
    try {
      const patchData = {};
      for (const field of ['nombre', 'categoria', 'pvp']) {
        if (req.body[field] !== undefined) {
          patchData[field] = field === 'pvp' ? Number(req.body[field]) : req.body[field];
        }
      }

      const updatedPartialProduct = await this.repository.patch(req.params.id, patchData);
      if (!updatedPartialProduct) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: `Producto con ID ${req.params.id} no encontrado para modificación parcial.`
        });
      }

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Producto modificado parcialmente (PATCH).',
        data: updatedPartialProduct
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const deleted = await this.repository.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: `Producto con ID ${req.params.id} no existe.`
        });
      }

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export { ProductsController as ProductosController };
