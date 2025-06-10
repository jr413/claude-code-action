import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface SessionsResponse {
  sessions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const ProfilePage = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery(
    'userProfile',
    async () => {
      const response = await axios.get('/auth/me');
      return response.data.data;
    }
  );

  const { data: sessions, isLoading: sessionsLoading } = useQuery<SessionsResponse>(
    ['userSessions', currentPage],
    async () => {
      const response = await axios.get(`/content/sessions?page=${currentPage}&limit=10`);
      return response.data.data;
    }
  );

  if (profileLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">プロフィール</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">アカウント情報</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">メールアドレス</p>
                <p className="text-white">{user?.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">プラン</p>
                <p className={`font-medium ${
                  profile?.plan_type === 'premium' ? 'text-yellow-400' :
                  profile?.plan_type === 'standard' ? 'text-blue-400' :
                  'text-gray-400'
                }`}>
                  {profile?.plan_type === 'premium' ? 'プレミアム' :
                   profile?.plan_type === 'standard' ? 'スタンダード' :
                   'フリー'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">登録日</p>
                <p className="text-white">
                  {profile?.created_at && 
                    format(new Date(profile.created_at), 'yyyy年MM月dd日', { locale: ja })
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">総セッション数</p>
                <p className="text-white">{profile?.total_sessions || 0}回</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">アカウント設定</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full btn-secondary text-sm"
              >
                パスワードを変更
              </button>
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 py-2 rounded-lg transition-colors text-sm"
              >
                アカウントを削除
              </button>
            </div>
          </div>
        </div>

        {/* Sessions History */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-dark-300">
              <h2 className="text-xl font-semibold text-white">視聴履歴</h2>
            </div>
            
            <div className="divide-y divide-dark-300">
              {sessions?.sessions.map((session: any) => (
                <div key={session.id} className="p-6 hover:bg-dark-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {session.character_display_name} - {session.scenario_title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {format(new Date(session.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.video_generation_status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : session.video_generation_status === 'processing'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : session.video_generation_status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {session.video_generation_status === 'completed' ? '完了' :
                         session.video_generation_status === 'processing' ? '処理中' :
                         session.video_generation_status === 'failed' ? '失敗' :
                         '保留中'}
                      </span>
                      {session.video_generation_status === 'completed' && (
                        <a
                          href={`/player/${session.id}`}
                          className="text-primary-400 hover:text-primary-300"
                        >
                          再生 →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {sessions?.sessions.length === 0 && (
                <div className="p-6 text-center text-gray-400">
                  まだ視聴履歴がありません
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {sessions && sessions.pagination.totalPages > 1 && (
              <div className="p-6 border-t border-dark-300 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary text-sm"
                >
                  前のページ
                </button>
                
                <span className="text-gray-400 text-sm">
                  {currentPage} / {sessions.pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(sessions.pagination.totalPages, p + 1))}
                  disabled={currentPage === sessions.pagination.totalPages}
                  className="btn-secondary text-sm"
                >
                  次のページ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
};

// Password Change Modal Component
const PasswordChangeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation(
    async () => {
      await axios.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
    },
    {
      onSuccess: () => {
        toast.success('パスワードが変更されました');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'パスワードの変更に失敗しました');
      },
    }
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">パスワードを変更</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              現在のパスワード
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              新しいパスワード
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              新しいパスワード（確認）
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            キャンセル
          </button>
          <button
            onClick={() => changePasswordMutation.mutate()}
            disabled={changePasswordMutation.isLoading}
            className="btn-primary flex-1"
          >
            {changePasswordMutation.isLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              '変更する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Account Modal Component
const DeleteAccountModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');

  const deleteAccountMutation = useMutation(
    async () => {
      await axios.delete('/users/account');
    },
    {
      onSuccess: () => {
        toast.success('アカウントが削除されました');
        logout();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'アカウントの削除に失敗しました');
      },
    }
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">アカウントを削除</h3>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">
            警告: この操作は取り消せません。すべてのデータが永久に削除されます。
          </p>
        </div>
        
        <p className="text-gray-300 mb-4">
          アカウントを削除するには、下記に「削除」と入力してください。
        </p>
        
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="削除"
          className="input-field mb-6"
        />
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            キャンセル
          </button>
          <button
            onClick={() => deleteAccountMutation.mutate()}
            disabled={confirmText !== '削除' || deleteAccountMutation.isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 disabled:opacity-50"
          >
            {deleteAccountMutation.isLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              'アカウントを削除'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};