import Joi from 'joi';

export const createCheckoutSchema = Joi.object({
  planType: Joi.string().valid('standard', 'premium').required().messages({
    'any.only': '有効なプランを選択してください',
    'any.required': 'プランタイプは必須です',
  }),
  successUrl: Joi.string().uri().optional(),
  cancelUrl: Joi.string().uri().optional(),
});