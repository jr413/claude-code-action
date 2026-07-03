export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-neutral-800">
      <div className="mb-8 rounded-lg bg-amber-50 p-4 text-amber-900">
        <p className="font-semibold">これは草案です</p>
        <p className="mt-1">
          リリース前に行政書士・弁護士による規約レビューを受けてください（仕様書Phase
          0タスク）。本文は法務専門家の確認を経ていません。
        </p>
      </div>

      <h1 className="text-xl font-bold">プライバシーポリシー</h1>

      <section className="mt-8 flex flex-col gap-2">
        <h2 className="font-semibold">1. 取得する情報</h2>
        <ul className="list-disc pl-5">
          <li>電話番号（SMS認証）</li>
          <li>
            本人確認書類の画像・生年月日（本人確認完了後、書類画像は速やかに削除します）
          </li>
          <li>ニックネーム、アイコン画像、一言プロフィール、興味タグ</li>
          <li>チェックイン情報（店舗、ステータス、一言、日時）</li>
          <li>合流リクエスト・メッセージの内容</li>
          <li>
            決済情報（Stripe社を通じて処理し、カード番号等は当社サーバーに保存しません）
          </li>
        </ul>
        <p className="mt-2 font-medium">
          本サービスは性別に関する情報を取得しません。また、GPSによるリアルタイム位置情報の取得・共有も行いません。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">2. 利用目的</h2>
        <ul className="list-disc pl-5">
          <li>本人確認・年齢確認</li>
          <li>チェックイン投稿・合流リクエスト・メッセージ機能の提供</li>
          <li>不正利用の防止、通報対応、利用規約違反への対処</li>
          <li>有料プランの決済処理</li>
          <li>サービス改善のための統計・分析（個人を特定しない形で実施）</li>
        </ul>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">3. 第三者提供</h2>
        <p>
          法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。決済処理のためStripe社に、認証・データベース基盤としてSupabase社に、必要な範囲で情報を預託します。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">4. 保管期間</h2>
        <p>
          本人確認書類の画像は、審査完了（承認）後速やかに削除します。その他の情報は、アカウント削除後、法令で定める期間を除き速やかに削除します。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">5. 開示・訂正・削除等の請求</h2>
        <p>
          利用者は、自己の個人情報について開示・訂正・削除等を請求できます。マイページから直接編集・削除できない情報については、運営までお問い合わせください。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">6. お問い合わせ窓口</h2>
        <p>
          本サービスに関するお問い合わせは、アプリ内の通報機能またはサポート窓口までご連絡ください。
        </p>
      </section>
    </main>
  );
}
