import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '有効なメールアドレスを入力してください',
    'any.required': 'メールアドレスは必須です',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'パスワードは8文字以上である必要があります',
    'any.required': 'パスワードは必須です',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'パスワードが一致しません',
    'any.required': 'パスワード確認は必須です',
  }),
  acceptTerms: Joi.boolean().valid(true).required().messages({
    'any.only': '利用規約に同意する必要があります',
    'any.required': '利用規約への同意は必須です',
  }),
  isOver18: Joi.boolean().valid(true).required().messages({
    'any.only': '18歳以上である必要があります',
    'any.required': '年齢確認は必須です',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '有効なメールアドレスを入力してください',
    'any.required': 'メールアドレスは必須です',
  }),
  password: Joi.string().required().messages({
    'any.required': 'パスワードは必須です',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '有効なメールアドレスを入力してください',
    'any.required': 'メールアドレスは必須です',
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'トークンは必須です',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'パスワードは8文字以上である必要があります',
    'any.required': 'パスワードは必須です',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'パスワードが一致しません',
    'any.required': 'パスワード確認は必須です',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'リフレッシュトークンは必須です',
  }),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': '確認トークンは必須です',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': '現在のパスワードは必須です',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': '新しいパスワードは8文字以上である必要があります',
    'any.required': '新しいパスワードは必須です',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'パスワードが一致しません',
    'any.required': 'パスワード確認は必須です',
  }),
});