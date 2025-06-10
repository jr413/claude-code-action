import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

interface ProfileForm {
  username: string
  full_name: string
}

interface PasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export default function Profile() {
  const updateUser = useAuthStore((state) => state.updateUser)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'usage'>('profile')

  // Fetch profile data
  const { data: profile, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/users/profile')
      return response.data
    },
  })

  // Fetch usage data
  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const response = await api.get('/users/usage')
      return response.data
    },
    enabled: activeTab === 'usage',
  })

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    defaultValues: {
      username: profile?.username || '',
      full_name: profile?.full_name || '',
    },
  })

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>()

  const newPassword = watch('new_password')

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await api.put('/users/profile', data)
      return response.data
    },
    onSuccess: (data) => {
      updateUser(data)
      toast.success('Profile updated successfully')
      refetch()
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await api.put('/users/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
      resetPasswordForm()
    },
  })

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate(data)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Account Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'usage'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Usage
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && profile && (
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="label">Username</label>
                <input
                  {...registerProfile('username', {
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters',
                    },
                  })}
                  defaultValue={profile.username}
                  className="input"
                />
                {profileErrors.username && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.username.message}</p>
                )}
              </div>

              <div>
                <label className="label">Full Name</label>
                <input
                  {...registerProfile('full_name', {
                    minLength: {
                      value: 2,
                      message: 'Full name must be at least 2 characters',
                    },
                  })}
                  defaultValue={profile.full_name || ''}
                  className="input"
                />
                {profileErrors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Current Plan</label>
                <div className="flex items-center space-x-2">
                  <span className="capitalize font-medium">{profile.plan_type}</span>
                  {profile.plan_expires_at && (
                    <span className="text-sm text-gray-500">
                      (Expires: {new Date(profile.plan_expires_at).toLocaleDateString()})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Member Since</label>
                <p className="text-gray-700 dark:text-gray-300">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="btn-primary"
                >
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <div className="card-body">
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
              <div>
                <label className="label">Current Password</label>
                <input
                  {...registerPassword('current_password', {
                    required: 'Current password is required',
                  })}
                  type="password"
                  className="input"
                />
                {passwordErrors.current_password && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.current_password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">New Password</label>
                <input
                  {...registerPassword('new_password', {
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  type="password"
                  className="input"
                />
                {passwordErrors.new_password && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.new_password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  {...registerPassword('confirm_password', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match',
                  })}
                  type="password"
                  className="input"
                />
                {passwordErrors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.confirm_password.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isLoading}
                  className="btn-primary"
                >
                  {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && usage && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Current Month Usage
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Videos Watched</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {usage.current_usage.videos_watched}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Watch Time</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {usage.current_usage.watch_time_hours} hours
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Videos Remaining</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {usage.remaining === 'unlimited' ? '∞' : usage.remaining}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Plan Limits
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Videos</span>
                  <span className="font-medium">
                    {usage.limits.monthly_videos === -1 ? 'Unlimited' : usage.limits.monthly_videos}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Maximum Quality</span>
                  <span className="font-medium">{usage.limits.max_quality}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plan Type</span>
                  <span className="font-medium capitalize">{usage.plan.type}</span>
                </div>
                
                {usage.plan.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Expires</span>
                    <span className="font-medium">
                      {new Date(usage.plan.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}