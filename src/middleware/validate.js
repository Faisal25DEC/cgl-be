export const validate =
  (schema) =>
  (req, res, next) => {
    if (!schema) return next();
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ ok: false, error: error.details.map(d => d.message) });
    }
    req.body = value;
    next();
  };
