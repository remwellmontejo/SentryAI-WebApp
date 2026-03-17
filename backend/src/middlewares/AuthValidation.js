import joi from 'joi';

const registerValidation = (req, res, next) => {
    const schema = joi.object({
        firstName: joi.string().max(50).optional().allow(''),
        lastName: joi.string().max(50).optional().allow(''),
        username: joi.string().alphanum().min(3).max(30).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: "Bad Request", error });
    }
    next();
}

const loginValidation = (req, res, next) => {
    const schema = joi.object({
        identifier: joi.string().required(),
        password: joi.string().required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: "Bad Request", error });
    }
    next();
}

export { registerValidation, loginValidation };