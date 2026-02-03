import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '规则说明 - 点点圈',
  description: '点点圈互助平台使用规则和信用体系说明',
}

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 gradient-primary text-white">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <a href="/" className="p-2 -ml-2 hover:bg-white/20 rounded-lg transition-colors">
            ←
          </a>
          <h1 className="text-lg font-semibold">规则说明</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4 pb-20">
        {/* 核心理念 */}
        <section className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>💡</span> 核心理念
          </h2>
          <p className="text-gray-600 mb-2">
            <strong>先助人，后受助。信用越好，曝光越高。</strong>
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            点点圈是一个纯公益的腾讯元宝抽奖互助平台。我们希望通过信用体系建立一个良性互助生态，让每个人都能公平地获得帮助。
          </p>
        </section>

        {/* 互助流程 */}
        <section className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>🔄</span> 互助流程
          </h2>
          <div className="space-y-3">
            {[
              '领取2个他人礼包（完成互助任务）',
              '获得发布资格',
              '发布自己的礼包',
              '其他用户领取，完成闭环',
            ].map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 信用等级 */}
        <section className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>📊</span> 信用等级体系
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2">等级</th>
                  <th className="text-left p-2">分数</th>
                  <th className="text-left p-2">额度</th>
                  <th className="text-left p-2">特权</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { badge: '🏆', name: '优秀', score: '90-100', quota: '3个', priv: '免审+置顶' },
                  { badge: '⭐', name: '良好', score: '75-89', quota: '2个', priv: '免审核' },
                  { badge: '🔹', name: '一般', score: '60-74', quota: '2个', priv: '需审核' },
                  { badge: '⚠️', name: '警告', score: '40-59', quota: '1个', priv: '需审核' },
                  { badge: '🚫', name: '受限', score: '20-39', quota: '0个', priv: '禁止发布' },
                  { badge: '❌', name: '封禁', score: '0-19', quota: '0个', priv: '禁止登录' },
                ].map((level) => (
                  <tr key={level.name} className="border-t border-gray-100">
                    <td className="p-2">
                      <span className="text-lg mr-1">{level.badge}</span>
                      {level.name}
                    </td>
                    <td className="p-2 text-gray-600">{level.score}</td>
                    <td className="p-2 text-gray-600">{level.quota}</td>
                    <td className="p-2 text-gray-600">{level.priv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 信用分规则 */}
        <section className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>📈</span> 信用分变动规则
          </h2>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-green-600">加分项：</h3>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>每日互助 +1分（上限2分/天）</li>
              <li>连续7天互助 +5分</li>
              <li>有效举报 +3分</li>
              <li>履行互助契约 +2分</li>
              <li>30天自然恢复 +5分</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-red-500">扣分项：</h3>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>虚假链接/图片 -20分</li>
              <li>领取无奖励 -10分</li>
              <li>垃圾广告 -30分</li>
              <li>未履行契约 -5分</li>
              <li>恶意举报 -2分</li>
              <li>作弊行为 -50分</li>
            </ul>
          </div>
        </section>

        {/* 温馨提示 */}
        <section className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-bold text-orange-600 mb-2">🤝 温馨提示</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>1. 请确保分享的链接或图片真实有效</li>
            <li>2. 互助完成后请及时确认，维护良好生态</li>
            <li>3. 遇到违规行为请积极举报</li>
            <li>4. 信用分越高，礼包曝光率越高</li>
          </ul>
        </section>
      </main>
    </div>
  )
}