export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-neutral-800">
      <div className="mb-8 rounded-lg bg-amber-50 p-4 text-amber-900">
        <p className="font-semibold">これは草案です</p>
        <p className="mt-1">
          リリース前に行政書士・弁護士による規約レビューを受けてください（仕様書Phase
          0タスク）。本文は法務専門家の確認を経ていません。
        </p>
      </div>

      <h1 className="text-xl font-bold">利用規約</h1>

      <section className="mt-8 flex flex-col gap-2">
        <h2 className="font-semibold">第1条（適用目的）</h2>
        <p>
          本規約は、「イマココ」（以下「本サービス」）の利用条件を定めるものです。本サービスは、地域の飲食店を介した現地でのゆるい交流を目的とするものであり、
          <strong>
            面識のない異性との出会い・交際を目的とした利用を固く禁止します。
          </strong>
          本サービスは性別に関する情報を一切取得・保持せず、性別に基づく機能の提供や表示の差異も行いません。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">第2条（利用資格）</h2>
        <ul className="list-disc pl-5">
          <li>18歳未満の方は本サービスをご利用いただけません。</li>
          <li>
            本サービスの利用には、運転免許証またはマイナンバーカードによる本人確認が必須です。本人確認が完了するまで、チェックイン・メッセージ送信等の機能はご利用いただけません。
          </li>
          <li>
            過去に本サービスの利用を停止（BAN）されたことがある方は再登録できません。
          </li>
        </ul>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">第3条（禁止事項）</h2>
        <p>
          利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。
        </p>
        <ul className="list-disc pl-5">
          <li>
            面識のない異性との出会い・交際を目的とした投稿・メッセージ送信
          </li>
          <li>
            金銭の授受を伴う交際（いわゆる「パパ活」等）を示唆・勧誘する行為
          </li>
          <li>他の利用者への迷惑行為、誹謗中傷、なりすまし</li>
          <li>虚偽の情報による登録・本人確認書類の偽造</li>
          <li>法令、公序良俗に違反する行為</li>
          <li>本サービスの運営を妨げる行為</li>
        </ul>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">第4条（合流のリクエストとメッセージ）</h2>
        <p>
          利用者間のメッセージ機能は、チェックインへの合流リクエストが投稿者本人によって承認された場合にのみ利用可能です（承認制）。メッセージは、対象のチェックインが終了してから24時間で送信不可となり、アーカイブされます。本機能は「今夜の合流調整」に限定されたものであり、長期的な交際関係の構築を目的とした利用はご遠慮ください。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">第5条（通報・利用停止）</h2>
        <p>
          運営は、利用者からの通報を受けた場合、原則として24時間以内に内容を確認し、投稿の非表示、警告、利用停止（BAN）等の措置を講じることがあります。第3条の禁止事項に該当すると判断した投稿は、システムにより自動的に非表示となる場合があります。警告を受けた利用者が違反行為を繰り返した場合、アカウントを停止します。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">第6条（有料プラン）</h2>
        <p>
          本サービスは無料プランに加え、月額制の有料プラン（プレミアム）を提供します。料金・決済はStripe社の決済システムを通じて行われます。安全機能（通報・ブロック・本人確認）は、プランにかかわらず全ての利用者が無料でご利用いただけます。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">第7条（免責事項）</h2>
        <p>
          運営は、利用者間の実際の合流・交流について一切の責任を負いません。利用者は自己の責任と判断において本サービスを利用するものとします。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="font-semibold">第8条（準拠法・管轄）</h2>
        <p>
          本規約は日本法に準拠し、本サービスに関する紛争は運営所在地を管轄する裁判所を専属的合意管轄とします。
        </p>
      </section>
    </main>
  );
}
