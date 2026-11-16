class ValidationHandler {
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }

  handle(request) {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
    return null;
  }
}

class NameValidator extends ValidationHandler {
  handle(request) {
    const { body, isRequired } = request;
    if (isRequired || body.nombre !== undefined) {
      if (typeof body.nombre !== 'string' || body.nombre.length < 3) {
        return 'El campo "nombre" es obligatorio y debe tener al menos 3 caracteres.';
      }
    }
    return super.handle(request);
  }
}

class CategoryValidator extends ValidationHandler {
  handle(request) {
    const { body, isRequired } = request;
    if (isRequired || body.categoria !== undefined) {
      if (typeof body.categoria !== 'string' || body.categoria.length < 3) {
        return 'El campo "categoria" es obligatorio y debe tener al menos 3 caracteres.';
      }
    }
    return super.handle(request);
  }
}

class PriceValidator extends ValidationHandler {
  handle(request) {
    const { body, isRequired } = request;
    if (isRequired || body.pvp !== undefined) {
      const pvp = Number(body.pvp);
      const isNumericValue = typeof body.pvp === 'number' || typeof body.pvp === 'string';
      if (
        !isNumericValue ||
        (typeof body.pvp === 'string' && body.pvp.trim() === '') ||
        !Number.isFinite(pvp) ||
        pvp < 0
      ) {
        return 'El campo "pvp" debe ser un número decimal válido mayor o igual a 0.';
      }
    }
    return super.handle(request);
  }
}

const buildValidationChain = () => {
  const nameHandler = new NameValidator();
  const categoryHandler = new CategoryValidator();
  const priceHandler = new PriceValidator();

  nameHandler.setNext(categoryHandler).setNext(priceHandler);
  return nameHandler;
};

export const validateProductBody = (isRequired = true) => {
  const chain = buildValidationChain();

  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'El cuerpo de la solicitud debe ser un objeto JSON.'
      });
    }

    const error = chain.handle({ body: req.body, isRequired });
    if (error) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: error
      });
    }

    next();
  };
};

export const validateProductId = (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'El ID del producto debe ser un entero positivo.'
    });
  }

  next();
};

export { validateProductBody as validateProductoBody, validateProductId as validateProductoId };
