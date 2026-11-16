import { settings } from '../config/settings.js';

export const paginationMiddleware = (req, res, next) => {
  const parsedPage = Number.parseInt(req.query.page, 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = settings.paginationLimit;
  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'El número de página está fuera del rango permitido.'
    });
  }

  req.pagination = { page, limit, offset };
  next();
};
