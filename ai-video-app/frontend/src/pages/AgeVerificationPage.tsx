import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AgeVerificationPage = () => {
  const navigate = useNavigate();
  const { logout, refreshToken } = useAuth();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const verifyAgeMutation = useMutation(
    async () => {
      await axios.post('/auth/verify-age');
    },
    {
      onSuccess: async () => {
        toast.success('年齢確認が完了しました');
        await refreshToken();
        navigate('/dashboard');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || '年齢確認に失敗しました');
      },
    }
  );

  const handleVerify = () => {
    if (!isConfirmed) {
      toast.error('年齢確認にチェックを入れてください');
      return;
    }
    verifyAgeMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 px-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          <div className="mb-6">
            <span className="text-6xl">🔞</span>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">年齢確認</h1>
          
          <p className="text-gray-300 mb-6">
            このサービスは18歳以上の方のみご利用いただけます。
            年齢確認にご協力ください。
          </p>
          
          <div className="bg-dark-300 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-400 mb-2">
              本サービスには成人向けコンテンツが含まれています。
              18歳未満の方の利用は固くお断りしております。
            </p>
            <p className="text-sm text-gray-400">
              虚偽の申告をされた場合、法的措置を取る場合があります。
            </p>
          </div>
          
          <div className="flex items-start mb-6">
            <input
              type="checkbox"
              id="ageConfirm"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-400 rounded bg-dark-200"
            />
            <label htmlFor="ageConfirm" className="ml-3 text-left text-gray-300">
              私は18歳以上であることを確認し、成人向けコンテンツの
              閲覧に同意します。
            </label>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleVerify}
              disabled={!isConfirmed || verifyAgeMutation.isLoading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {verifyAgeMutation.isLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                '年齢確認を完了する'
              )}
            </button>
            
            <button
              onClick={logout}
              className="w-full btn-secondary"
            >
              ログアウト
            </button>
          </div>
        </div>
        
        <p className="text-center text-gray-500 text-sm mt-4">
          年齢確認は法令遵守のため必須となっております。
          ご理解とご協力をお願いいたします。
        </p>
      </div>
    </div>
  );
};