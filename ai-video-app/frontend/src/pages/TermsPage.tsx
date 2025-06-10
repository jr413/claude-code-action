import { Link } from 'react-router-dom';

export const TermsPage = () => {
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
          <h1 className="text-3xl font-bold text-white mb-8">利用規約</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第1条（適用）</h2>
              <p>
                本規約は、AI Video App（以下「当サービス」）の利用条件を定めるものです。
                登録ユーザーの皆さま（以下「ユーザー」）には、本規約に従って、
                当サービスをご利用いただきます。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第2条（利用登録）</h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  登録希望者が当社の定める方法によって利用登録を申請し、
                  当社がこれを承認することによって、利用登録が完了するものとします。
                </li>
                <li>
                  当社は、以下の場合には、登録を承認しないことがあります。
                  <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                    <li>18歳未満の場合</li>
                    <li>虚偽の事項を届け出た場合</li>
                    <li>本規約に違反したことがある者からの申請である場合</li>
                    <li>その他、当社が利用登録を相当でないと判断した場合</li>
                  </ul>
                </li>
              </ol>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第3条（年齢制限）</h2>
              <p>
                当サービスは18歳以上の方のみご利用いただけます。
                18歳未満の方の利用は固くお断りしております。
                年齢を偽って利用した場合、法的措置を取る場合があります。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第4条（禁止事項）</h2>
              <p>ユーザーは、以下の行為をしてはなりません。</p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当サービスのコンテンツを無断で転載、複製、配布する行為</li>
                <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>当サービスによって得られた情報を商業的に利用する行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第5条（料金および支払方法）</h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  ユーザーは、当サービスの有料部分の対価として、
                  当社が別途定める料金を、当社が指定する方法により支払うものとします。
                </li>
                <li>
                  ユーザーが料金の支払を遅滞した場合、年14.6％の割合による遅延損害金を支払うものとします。
                </li>
              </ol>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第6条（コンテンツの取り扱い）</h2>
              <p>
                当サービスで提供されるすべてのコンテンツ（AI生成動画、音声等）の
                著作権その他の知的財産権は当社に帰属します。
                ユーザーは、当社の許可なくコンテンツを複製、転載、配布することはできません。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第7条（保証の否認および免責事項）</h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  当社は、当サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。
                </li>
                <li>
                  当社は、当サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
                </li>
              </ol>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第8条（サービス内容の変更等）</h2>
              <p>
                当社は、ユーザーに通知することなく、当サービスの内容を変更しまたは
                当サービスの提供を中止することができるものとし、
                これによってユーザーに生じた損害について一切の責任を負いません。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第9条（利用規約の変更）</h2>
              <p>
                当社は、必要と判断した場合には、ユーザーに通知することなく
                いつでも本規約を変更することができるものとします。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">第10条（準拠法・裁判管轄）</h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
                <li>
                  当サービスに関して紛争が生じた場合には、
                  当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
                </li>
              </ol>
            </section>
            
            <div className="mt-8 pt-8 border-t border-dark-400">
              <p className="text-sm text-gray-400">
                制定日：2024年1月1日<br />
                最終更新日：2024年1月1日
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};