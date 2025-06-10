import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Check, X } from 'lucide-react'

type RegisterFormData = {
  email: string
  username: string
  password: string
  confirmPassword: string
  ageConfirmed: boolean
  termsAccepted: boolean
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>()
  
  const password = watch('password', '')
  
  const passwordRequirements = [
    { regex: /.{8,}/, text: '8文字以上' },
    { regex: /[A-Z]/, text: '大文字を含む' },
    { regex: /[a-z]/, text: '小文字を含む' },
    { regex: /[0-9]/, text: '数字を含む' },
  ]
  
  const onSubmit = async (data: RegisterFormData) => {
    try {
      // TODO: Implement actual registration
      console.log('Registration data:', data)
      toast.success('登録が完了しました')
      navigate('/dashboard')
    } catch (error) {
      toast.error('登録に失敗しました')
    }
  }
  
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-6">新規登録</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'メールアドレスを入力してください',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '有効なメールアドレスを入力してください'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              {...register('username', {
                required: 'ユーザー名を入力してください',
                minLength: {
                  value: 3,
                  message: 'ユーザー名は3文字以上で入力してください'
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: '英数字とアンダースコアのみ使用できます'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                {...register('password', {
                  required: 'パスワードを入力してください',
                  minLength: {
                    value: 8,
                    message: 'パスワードは8文字以上で入力してください'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
                    message: 'パスワードは大文字、小文字、数字を含む必要があります'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center text-sm">
                    {req.regex.test(password) ? (
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={req.regex.test(password) ? 'text-green-700' : 'text-gray-600'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（確認）
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: 'パスワードを再入力してください',
                  validate: value => value === password || 'パスワードが一致しません'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="checkbox"
                {...register('ageConfirmed', {
                  required: '年齢確認が必要です'
                })}
                className="mt-1 mr-2"
              />
              <span className="text-sm text-gray-600">
                私は18歳以上であることを確認します
              </span>
            </label>
            {errors.ageConfirmed && (
              <p className="text-sm text-red-600">{errors.ageConfirmed.message}</p>
            )}
            
            <label className="flex items-start">
              <input
                type="checkbox"
                {...register('termsAccepted', {
                  required: '利用規約への同意が必要です'
                })}
                className="mt-1 mr-2"
              />
              <span className="text-sm text-gray-600">
                <Link to="/terms" className="text-primary-600 hover:text-primary-700">利用規約</Link>と
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">プライバシーポリシー</Link>に同意します
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '登録中...' : '登録する'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちの方は{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage