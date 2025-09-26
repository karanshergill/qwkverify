import Joi from 'joi';

export const verifyLoginSchema = Joi.object({
    userName: Joi.string()
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

export const updateLoginCredsSchema = Joi.object({
    newUserName: Joi.string()
        .required()
        .messages({
            'any.required': 'User Name is Required.',
        }),
    newPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is Required.',
        }),
});