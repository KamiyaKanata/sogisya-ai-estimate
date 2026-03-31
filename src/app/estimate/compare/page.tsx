'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SEED_PRODUCTS } from '@/lib/data'
import type { EstimateItem } from '@/lib/types'

type Plan = 'economy' | 'standard' | 'premium'

const PLAN_DEFS: { key: Plan; label: string; subtitle: string; color: string; bg: string; border: string }[] = [
  { key: 'economy',  label: 'エコノミー', subtitle: '直葬・火葬式',  color: 'text-gray-700',    bg: 'bg-gray-50',  border: 'border-gray-200' },
  { key: 'standard', label: 'スタンダード', subtitle: '一日葬・家族葬', color: 'text-blue-700',   bg: 'bg-blue-50',  border: 'border-blue-200' },
  { key: 'premium',  label: 'プレミアム',  subtitle: '一般葬',      color: 'text-[#B8860B]',  bg: 'bg-amber-50', border: 'border-amber-200' },
]

interface PlanItems {
  economy: EstimateItem[]
  standard: EstimateItem[]
  premium: EstimateItem[]
}

function buildPlanItems(): PlanItems {
  const all = SEED_PRODUCTS

  const pick = (names: string[], qty = 1): EstimateItem[] =>
    names.map(name => {
      const p = all.find(p => p.name === name)
      if (!p) return null
      const amount = p.price * qty
      return { product_id: p.id, product_name: p.name, category: p.category, unit_price: p.price, quantity: qty, amount, tax_type: p.tax_type }
    }).filter(Boolean) as EstimateItem[]

  const economy = pick([
    '布張棺（標準）', '白磁 7寸',
    'ドライアイス（1日）', '安置料（1日）', '運搬費（基本）',
    '遺影写真加工', '火葬料（市民）', '洋型霊柩車',
  ])

  const standard = [
    ...pick([
      '桐棺', '白磁 7寸',
      '花祭壇 S',
      '式場使用料（1日）', 'ドライアイス（1日）', '安置料（1日）',
      '運搬費（基本）', '遺影写真加工', '火葬料（市民）', '洋型霊柩車',
      '会葬御礼品',
    ]),
  ]

  const premium = [
    ...pick([
      '彫刻棺', '大理石調 7寸',
      '花祭壇 L',
      '式場使用料（1日）', 'ドライアイス（1日）', '安置料（1日）',
      '運搬費（基本）', '遺影写真加工', '火葬料（市民）', '洋型霊柩車',
      '会葬御礼品', '精進落とし（一人）', '即日香典返し',
    ]),
  ]

  // adjust quantities for scale
  return {
    economy,
    standard: standard.map(i => i.product_name === '会葬御礼品' ? { ...i, quantity: 30, amount: i.unit_price * 30 } : i),
    premium: premium.map(i => {
      if (i.product_name === '精進落とし（一人）') return { ...i, quantity: 50, amount: i.unit_price * 50 }
      if (i.product_name === '即日香典返し') return { ...i, quantity: 50, amount: i.unit_price * 50 }
      if (i.product_name === '会葬御礼品') return { ...i, quantity: 80, amount: i.unit_price * 80 }
      return i
    }),
  }
}

function calcTotal(items: EstimateItem[]) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const tax = items.reduce((s, i) => {
    if (i.tax_type === '課税10%') return s + Math.floor(i.amount * 0.1)
    if (i.tax_type === '課税8%') return s + Math.floor(i.amount * 0.08)
    return s
  }, 0)
  return { subtotal, tax, total: subtotal + tax }
}

function yen(n: number) { return n.toLocaleString('ja-JP') + '円' }

export default function ComparePage() {
  const [mounted, setMounted] = useState(false)
  const [plans, setPlans] = useState<PlanItems>({ economy: [], standard: [], premium: [] })
  const [selected, setSelected] = useState<Plan | null>(null)

  useEffect(() => {
    setMounted(true)
    setPlans(buildPlanItems())
  }, [])

  if (!mounted) return null

  const totals = {
    economy: calcTotal(plans.economy),
    standard: calcTotal(plans.standard),
    premium: calcTotal(plans.premium),
  }

  const FEATURES: { label: string; economy: string; standard: string; premium: string }[] = [
    { label: '葬儀形式',    economy: '直葬・火葬式',    standard: '一日葬・家族葬',  premium: '一般葬' },
    { label: '参列者目安',  economy: '遺族のみ（〜10名）', standard: '〜30名',       premium: '30名以上' },
    { label: '祭壇',        economy: 'なし',            standard: 'シンプル',        premium: '豪華祭壇' },
    { label: '生花',        economy: 'なし',            standard: '小（枕花程度）',   premium: '大（祭壇装飾）' },
    { label: 'お食事',      economy: 'なし',            standard: 'なし',            premium: 'あり（精進落とし等）' },
    { label: '返礼品',      economy: 'なし',            standard: 'なし',            premium: 'あり' },
    { label: '会葬礼状',    economy: 'なし',            standard: 'あり',            premium: 'あり' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <Link href="/dashboard" className="text-gray-400 text-xs hover:text-gray-600">← ダッシュボードへ戻る</Link>
        <div className="mt-2">
          <h1 className="text-xl font-bold text-[#2B3A4E]">プラン比較</h1>
          <p className="text-sm text-gray-400 mt-0.5">エコノミー・スタンダード・プレミアムの3プランを比較できます</p>
        </div>
      </div>

      <div className="p-8 max-w-5xl">
        {/* 料金カード */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {PLAN_DEFS.map(plan => {
            const t = totals[plan.key]
            const isSelected = selected === plan.key
            return (
              <div
                key={plan.key}
                onClick={() => setSelected(isSelected ? null : plan.key)}
                className={`bg-white rounded-xl border-2 shadow-sm p-6 cursor-pointer transition-all ${
                  isSelected ? `${plan.border} shadow-md` : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-3 ${plan.bg} ${plan.color}`}>
                  {plan.label}
                </div>
                <p className="text-xs text-gray-400 mb-2">{plan.subtitle}</p>
                <p className="text-3xl font-bold text-[#2B3A4E]">{yen(t.total)}</p>
                <p className="text-xs text-gray-400 mt-1">税込 / 目安</p>
                <p className="text-xs text-gray-300 mt-0.5">小計 {yen(t.subtotal)} + 税 {yen(t.tax)}</p>
                {isSelected && (
                  <div className={`mt-3 text-xs font-medium ${plan.color}`}>✓ 選択中 — 内訳を表示中</div>
                )}
              </div>
            )
          })}
        </div>

        {/* 特徴比較表 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#2B3A4E]">プラン特徴比較</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs text-gray-400 w-1/4">項目</th>
                {PLAN_DEFS.map(p => (
                  <th key={p.key} className={`px-5 py-3 text-center text-xs font-bold w-1/4 ${p.color}`}>
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {FEATURES.map(f => (
                <tr key={f.label} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-500 text-xs">{f.label}</td>
                  <td className="px-5 py-3 text-center text-sm text-gray-600">{f.economy}</td>
                  <td className="px-5 py-3 text-center text-sm text-gray-600">{f.standard}</td>
                  <td className="px-5 py-3 text-center text-sm text-gray-600">{f.premium}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td className="px-5 py-3 text-[#2B3A4E] text-xs">目安金額（税込）</td>
                {PLAN_DEFS.map(p => (
                  <td key={p.key} className={`px-5 py-3 text-center text-base ${p.color}`}>
                    {yen(totals[p.key].total)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 選択プランの内訳 */}
        {selected && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3`}>
              <h2 className="font-bold text-[#2B3A4E]">
                {PLAN_DEFS.find(p => p.key === selected)?.label} — 内訳明細
              </h2>
              <Link
                href="/estimate/new"
                className="ml-auto bg-[#B8860B] hover:bg-[#8B6508] text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                このプランで見積もりを作成 →
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs text-gray-400">商品名</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-400">カテゴリ</th>
                  <th className="px-5 py-3 text-right text-xs text-gray-400">単価</th>
                  <th className="px-5 py-3 text-center text-xs text-gray-400">数量</th>
                  <th className="px-5 py-3 text-right text-xs text-gray-400">小計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {plans[selected].map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-700">{item.product_name}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{item.category}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{yen(item.unit_price)}</td>
                    <td className="px-5 py-3 text-center text-gray-500">{item.quantity}</td>
                    <td className="px-5 py-3 text-right font-medium text-[#2B3A4E]">{yen(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <td colSpan={4} className="px-5 py-3 text-[#2B3A4E]">合計（税込）</td>
                  <td className="px-5 py-3 text-right text-lg text-[#2B3A4E]">{yen(totals[selected].total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
