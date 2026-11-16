export const sanitizationMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = value.replace(/<\/?[^>]+(>|$)/g, '').trim();
      }
    }
  }

  next();
};
