import Joi from 'joi';

export const generateContentSchema = Joi.object({
  characterId: Joi.string().uuid().required().messages({
    'string.guid': '有効なキャラクターIDを指定してください',
    'any.required': 'キャラクターIDは必須です',
  }),
  scenarioId: Joi.string().uuid().required().messages({
    'string.guid': '有効なシナリオIDを指定してください',
    'any.required': 'シナリオIDは必須です',
  }),
});