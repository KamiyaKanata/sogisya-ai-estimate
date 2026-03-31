'use client'

import { SEED_PRODUCTS } from '@/lib/data'

const CATEGORY_ORDER = ['祭壇', '棺', '骨壺', '運営', '料理', '返礼品', '車両', 'その他']

export default function AdminProductsPage() {
  const sorted = [...SEED_PRODUCTS].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#2B3A4E] mb-2">商品マスタ</h1>
      <p className="text-gray-400 text-sm mb-6">プロトタイプ：初期データの参照のみ</p>

      {CATEGORY_ORDER.map(cat => {
        const items = sorted.filter(p => p.category === cat)
        if (!items.length) return null
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-sm font-bold text-[#2B3A4E] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#B8860B] rounded-full inline-block" />
              {cat}
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">商品名</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400">単価（税抜）</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">税区分</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">人数課金</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-700">{p.name}</td>
                      <td className="px-5 py-3 text-right font-medium text-[#2B3A4E]">{p.price.toLocaleString()}円</td>
                      <td className="px-5 py-3 text-gray-500">{p.tax_type}</td>
                      <td className="px-5 py-3 text-gray-500">{p.is_per_person ? '○' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
