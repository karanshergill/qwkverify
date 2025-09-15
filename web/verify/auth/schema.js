import Joi from 'joi';

export const verifyLoginSchema = Joi.object({
    username: Joi.string()
        .required()
        .messages({
            'any.required': 'User Name is Required.',
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is Required.',
        }),
});