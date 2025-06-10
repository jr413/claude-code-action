import { Link } from 'react-router-dom';

export const CommercialLawPage = () => {
  return (
    <div className="min-h-screen bg-dark-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-gray-400 hover:text-white mb-8 inline-flex items-center"
        >
          ← トップに戻る
        </Link>
        
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-white mb-8">特定商取引法に基づく表記</h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">販売事業者名</div>
              <div className="md:col-span-2 text-gray-300">
                AI Video App株式会社
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">代表者名</div>
              <div className="md:col-span-2 text-gray-300">
                代表取締役 山田太郎
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">所在地</div>
              <div className="md:col-span-2 text-gray-300">
                〒150-0001<br />
                東京都渋谷区神宮前1-2-3 AIビル4F
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">電話番号</div>
              <div className="md:col-span-2 text-gray-300">
                03-1234-5678<br />
                <span className="text-sm text-gray-500">
                  ※お問い合わせはメールにてお願いいたします
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">メールアドレス</div>
              <div className="md:col-span-2 text-gray-300">
                support@aivideoapp.com
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">運営統括責任者</div>
              <div className="md:col-span-2 text-gray-300">
                山田太郎
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">商品の販売価格</div>
              <div className="md:col-span-2 text-gray-300">
                各プランページに記載<br />
                スタンダードプラン: 月額2,980円（税込）<br />
                プレミアムプラン: 月額8,980円（税込）
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">商品代金以外の必要料金</div>
              <div className="md:col-span-2 text-gray-300">
                なし
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">支払方法</div>
              <div className="md:col-span-2 text-gray-300">
                クレジットカード決済（Visa, Mastercard, American Express, JCB）
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">支払時期</div>
              <div className="md:col-span-2 text-gray-300">
                クレジットカード決済：ご注文確定時<br />
                月額プランは毎月自動更新
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">商品の引渡し時期</div>
              <div className="md:col-span-2 text-gray-300">
                決済完了後、即時利用可能
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">返品・交換・キャンセル等</div>
              <div className="md:col-span-2 text-gray-300">
                サービスの性質上、返品・返金は原則として受け付けておりません。<br />
                ただし、サービスに重大な瑕疵がある場合はこの限りではありません。<br />
                月額プランはいつでもキャンセル可能です。<br />
                キャンセル後も、お支払い済みの期間終了まではサービスをご利用いただけます。
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">動作環境</div>
              <div className="md:col-span-2 text-gray-300">
                <p className="mb-2">推奨ブラウザ：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Google Chrome（最新版）</li>
                  <li>Mozilla Firefox（最新版）</li>
                  <li>Safari（最新版）</li>
                  <li>Microsoft Edge（最新版）</li>
                </ul>
                <p className="mt-2">
                  ※Internet Explorerには対応しておりません<br />
                  ※スマートフォン・タブレットでの動作も保証しております
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">年齢制限</div>
              <div className="md:col-span-2 text-gray-300">
                本サービスは18歳以上の方のみご利用いただけます。<br />
                18歳未満の方の利用は固くお断りしております。
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-400">その他特記事項</div>
              <div className="md:col-span-2 text-gray-300">
                本サービスはAI技術を使用した映像生成サービスです。<br />
                生成される映像の品質は、技術の進歩により予告なく変更される場合があります。
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-dark-400">
            <p className="text-sm text-gray-400">
              最終更新日：2024年1月1日
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};