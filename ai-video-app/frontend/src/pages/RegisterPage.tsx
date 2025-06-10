import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  isOver18: boolean;
}

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser(data);
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold gradient-text">新規登録</h2>
          <p className="mt-2 text-gray-400">
            アカウントを作成して始めましょう
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                メールアドレス
              </label>
              <input
                {...register('email', {
                  required: 'メールアドレスは必須です',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '有効なメールアドレスを入力してください',
                  },
                })}
                type="email"
                autoComplete="email"
                className="input-field mt-1"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                パスワード
              </label>
              <input
                {...register('password', {
                  required: 'パスワードは必須です',
                  minLength: {
                    value: 8,
                    message: 'パスワードは8文字以上である必要があります',
                  },
                })}
                type="password"
                autoComplete="new-password"
                className="input-field mt-1"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                パスワード（確認）
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'パスワード確認は必須です',
                  validate: (value) =>
                    value === password || 'パスワードが一致しません',
                })}
                type="password"
                autoComplete="new-password"
                className="input-field mt-1"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <input
                {...register('isOver18', {
                  required: '年齢確認は必須です',
                })}
                type="checkbox"
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-400 rounded bg-dark-200"
              />
              <label htmlFor="isOver18" className="ml-2 block text-sm text-gray-300">
                私は18歳以上であることを確認します
              </label>
            </div>
            {errors.isOver18 && (
              <p className="text-sm text-red-400">{errors.isOver18.message}</p>
            )}

            <div className="flex items-start">
              <input
                {...register('acceptTerms', {
                  required: '利用規約への同意は必須です',
                })}
                type="checkbox"
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-400 rounded bg-dark-200"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-300">
                <Link to="/terms" className="text-primary-400 hover:text-primary-300">
                  利用規約
                </Link>
                と
                <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
                  プライバシーポリシー
                </Link>
                に同意します
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-400">{errors.acceptTerms.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner size="small" /> : '登録する'}
          </button>

          <div className="text-center">
            <span className="text-gray-400">既にアカウントをお持ちの方は</span>{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300">
              ログイン
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};