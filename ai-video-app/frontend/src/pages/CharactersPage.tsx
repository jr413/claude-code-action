import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LoadingSpinner } from '../components/LoadingSpinner';
import clsx from 'clsx';

interface Character {
  id: string;
  name: string;
  display_name: string;
  thumbnail_url: string;
  description: string;
  plan_required: string;
  isLocked: boolean;
}

export const CharactersPage = () => {
  const { data: characters, isLoading } = useQuery<Character[]>(
    'characters',
    async () => {
      const response = await axios.get('/characters');
      return response.data.data;
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">キャラクター選択</h1>
        <p className="text-gray-400">
          お好みのキャラクターを選んで体験を始めましょう
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters?.map((character) => (
          <Link
            key={character.id}
            to={character.isLocked ? '/payment' : `/characters/${character.id}`}
            className={clsx(
              'card-hover group relative overflow-hidden',
              character.isLocked && 'opacity-75'
            )}
          >
            {/* Character Image */}
            <div className="aspect-w-16 aspect-h-9 bg-dark-300">
              {character.thumbnail_url ? (
                <img
                  src={character.thumbnail_url}
                  alt={character.display_name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center">
                  <span className="text-6xl opacity-50">👤</span>
                </div>
              )}
              
              {/* Overlay for locked characters */}
              {character.isLocked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl mb-2">🔒</span>
                    <p className="text-white font-semibold">
                      {character.plan_required === 'premium' ? 'プレミアム限定' : 'スタンダード以上'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Character Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-primary-400 transition-colors">
                  {character.display_name}
                </h3>
                {character.plan_required !== 'free' && (
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded',
                    character.plan_required === 'premium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  )}>
                    {character.plan_required === 'premium' ? 'Premium' : 'Standard'}
                  </span>
                )}
              </div>
              
              <p className="text-gray-400 text-sm line-clamp-2">
                {character.description}
              </p>

              {!character.isLocked && (
                <div className="mt-4 flex items-center text-primary-400 text-sm">
                  <span>シナリオを見る</span>
                  <span className="ml-1">→</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {characters?.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">😢</span>
          <p className="mt-4 text-gray-400">
            現在利用可能なキャラクターがありません
          </p>
        </div>
      )}
    </div>
  );
};