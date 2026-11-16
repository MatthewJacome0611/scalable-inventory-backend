import crypto from 'node:crypto';

export const hashMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    const hash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
    res.setHeader('ETag', `"${hash}"`);
    res.setHeader('X-Content-Hash', hash);
    return originalJson(body);
  };

  next();
};
