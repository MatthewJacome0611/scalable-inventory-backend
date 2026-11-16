import { Router } from 'express';
import { ProductsController } from '../controllers/ProductosController.js';
import { validateProductBody, validateProductId } from '../middlewares/chainValidator.js';
import { paginationMiddleware } from '../middlewares/pagination.js';

const router = Router();
const controller = new ProductsController();

router.get('/', paginationMiddleware, controller.getAll);
router.get('/:id', validateProductId, controller.getById);
router.post('/', validateProductBody(true), controller.create);
router.put('/:id', validateProductId, validateProductBody(true), controller.update);
router.patch('/:id', validateProductId, validateProductBody(false), controller.patch);
router.delete('/:id', validateProductId, controller.delete);

export default router;
