'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCases, getEstimatesByCaseId, saveCases, addEstimate, calcTotals, SEED_PRODUCTS } from '@/lib/data'
import type { Case, Estimate, EstimateItem, ProductCategory, Status } from '@/lib/types'

const CATEGORY_COLOR: Record<string, string> = {
  '祭壇': 'bg-purple-100 text-purple-700',
  '棺':   'bg-amber-100 text-amber-700',
  '骨壺': 'bg-sky-100 text-sky-700',
  '運営': 'bg-teal-100 text-teal-700',
  '料理': 'bg-green-100 text-green-700',
  '返礼品': 'bg-pink-100 text-pink-700',
  '車両': 'bg-orange-100 text-orange-700',
}

const CATEGORY_ORDER: ProductCategory[] = ['祭壇', '棺', '骨壺', '運営', '料理', '返礼品', '車両', 'その他']

const STATUS_OPTIONS: Status[] = ['相談中', '見積済', '施行中', '完了', '精算済']

const NAV_TABS = [
  { id: 'estimate',   label: '見積もり', icon: '¥' },
  { id: 'documents',  label: '書類生成', icon: '📄' },
  { id: 'settlement', label: '精算・請求', icon: '精' },
  { id: 'kouden',     label: '香典帳',  icon: '香' },
  { id: 'procedures', label: '手続き',  icon: '✓' },
]

function yen(n: number) { return n.toLocaleString('ja-JP') + '円' }

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('estimate')
  const [isEditing, setIsEditing] = useState(false)
  const [editItems, setEditItems] = useState<EstimateItem[]>([])
  const [editDiscount, setEditDiscount] = useState(0)

  useEffect(() => {
    setMounted(true)
    const cases = getCases()
    const c = cases.find(c => c.id === params.id) ?? null
    setCaseData(c)
    if (c) {
      const ests = getEstimatesByCaseId(c.id)
      setEstimates(ests)
    }
  }, [params.id])

  if (!mounted) return null
  if (!caseData) return (
    <div className="p-8">
      <p className="text-gray-400 mb-4">案件が見つかりません。</p>
      <Link href="/dashboard" className="text-[#B8860B] text-sm">← ダッシュボードへ</Link>
    </div>
  )

  const estimate = estimates[estimates.length - 1]
  const totals = estimate ? calcTotals(estimate.items) : null
  const finalTotal = totals ? totals.total - (estimate?.discount ?? 0) : 0

  // ステータス更新
  const updateStatus = (status: Status) => {
    const all = getCases()
    const updated = all.map(c => c.id === caseData.id ? { ...c, status } : c)
    saveCases(updated)
    setCaseData(prev => prev ? { ...prev, status } : prev)
  }

  // 見積もり編集開始
  const startEdit = () => {
    if (!estimate) return
    setEditItems(estimate.items.map(i => ({ ...i })))
    setEditDiscount(estimate.discount)
    setIsEditing(true)
  }

  // 見積もり保存（新バージョン）
  const saveEdit = () => {
    const now = new Date().toISOString()
    const totals = calcTotals(editItems)
    const newEst: Estimate = {
      id: crypto.randomUUID(),
      case_id: caseData.id,
      version: (estimate?.version ?? 0) + 1,
      items: editItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      discount: editDiscount,
      created_at: now,
    }
    addEstimate(newEst)
    setEstimates(prev => [...prev, newEst])
    setIsEditing(false)
  }

  const updateEditItem = (idx: number, field: keyof EstimateItem, value: string | number) => {
    setEditItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'product_name') {
        const p = SEED_PRODUCTS.find(p => p.name === value)
        if (p) { updated.unit_price = p.price; updated.tax_type = p.tax_type; updated.category = p.category }
      }
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : updated.quantity
        const price = field === 'unit_price' ? Number(value) : updated.unit_price
        updated.amount = qty * price
      }
      return updated
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ページヘッダー */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/dashboard" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
              ← ダッシュボードへ戻る
            </Link>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <h1 className="text-xl font-bold text-[#2B3A4E]">{caseData.deceased_name} 様</h1>
                <p className="text-gray-400 text-sm">{caseData.deceased_kana}　／　喪主：{caseData.chief_mourner_name}　／　{caseData.ceremony_type}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* ステータス変更 */}
            <select
              value={caseData.status}
              onChange={e => updateStatus(e.target.value as Status)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2B3A4E]/20"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {caseData.share_token && (
              <Link
                href={`/share/${caseData.share_token}`}
                target="_blank"
                className="border border-[#2B3A4E] text-[#2B3A4E] hover:bg-[#2B3A4E] hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                🔗 遺族に共有
              </Link>
            )}
            <button onClick={() => window.print()} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm transition-colors">
              🖨 印刷
            </button>
          </div>
        </div>

        {/* タブナビ */}
        <div className="flex gap-1 mt-5">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== 'estimate') router.push(`/${tab.id === 'estimate' ? 'estimate' : tab.id}/${params.id}`) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#2B3A4E] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="p-8">
        {/* --- 基本情報カード --- */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { l: '逝去日', v: caseData.date_of_death },
            { l: '宗派', v: caseData.sect || caseData.religion },
            { l: '参列者数', v: caseData.expected_attendees + '名' },
            { l: '式場', v: caseData.venue_name || '—' },
          ].map(item => (
            <div key={item.l} className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{item.l}</p>
              <p className="font-semibold text-[#2B3A4E] text-sm">{item.v}</p>
            </div>
          ))}
        </div>

        {/* --- 見積もりタブ --- */}
        {!estimate ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-500 font-medium mb-2">まだ見積もりが作成されていません</p>
            <p className="text-gray-400 text-sm mb-6">「見積もり作成」から新しい見積もりを作成してください</p>
            <Link href="/estimate/new" className="bg-[#B8860B] hover:bg-[#8B6508] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors inline-block">
              ＋ 見積もりを作成する
            </Link>
          </div>
        ) : isEditing ? (
          /* 編集モード */
          <div className="bg-white rounded-xl border border-[#B8860B]/30 shadow-sm p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#2B3A4E]">見積もり編集 v{(estimate.version ?? 0) + 1}</h2>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  キャンセル
                </button>
                <button onClick={saveEdit} className="bg-[#B8860B] hover:bg-[#8B6508] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  保存する
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-xs text-gray-400">商品名</th>
                  <th className="px-4 py-2.5 text-right text-xs text-gray-400">数量</th>
                  <th className="px-4 py-2.5 text-right text-xs text-gray-400">単価</th>
                  <th className="px-4 py-2.5 text-right text-xs text-gray-400">金額</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {editItems.map((item, idx) => {
                  const catProducts = SEED_PRODUCTS.filter(p => p.category === item.category)
                  return (
                    <tr key={idx}>
                      <td className="px-4 py-2">
                        <select value={item.product_name} onChange={e => updateEditItem(idx, 'product_name', e.target.value)} className="input text-sm py-1">
                          {catProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" min="0" value={item.quantity} onChange={e => updateEditItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="input text-sm py-1 w-16 text-right" />
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">{item.unit_price.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-medium text-[#2B3A4E]">{item.amount.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => setEditItems(p => p.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-400 transition-colors text-lg">×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <button
              onClick={() => { const f = SEED_PRODUCTS[0]; setEditItems(p => [...p, { category: f.category, product_name: f.name, quantity: 1, unit_price: f.price, tax_type: f.tax_type, amount: f.price }]) }}
              className="mt-3 text-sm text-[#B8860B] hover:text-[#8B6508] transition-colors"
            >＋ 項目を追加</button>
            <div className="mt-6 flex justify-between items-end border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <label className="text-gray-500">割引額：</label>
                <input type="number" min="0" value={editDiscount} onChange={e => setEditDiscount(parseInt(e.target.value) || 0)} className="input w-28 text-right py-1 text-sm" />
                <span className="text-gray-500">円</span>
              </div>
              <div className="text-right space-y-1 text-sm">
                {(() => { const t = calcTotals(editItems); return (
                  <>
                    <div className="text-gray-500">小計 {yen(t.subtotal)}　税 {yen(t.tax)}</div>
                    <div className="font-bold text-[#2B3A4E] text-lg">合計 {yen(t.total - editDiscount)}</div>
                  </>
                )})()}
              </div>
            </div>
          </div>
        ) : (
          /* 表示モード */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[#2B3A4E]">見積もり明細</h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  v{estimate.version}　{new Date(estimate.created_at).toLocaleDateString('ja-JP')}
                </span>
                {estimates.length > 1 && (
                  <span className="text-xs text-gray-400">（全{estimates.length}版）</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={startEdit} className="border border-[#2B3A4E] text-[#2B3A4E] hover:bg-[#2B3A4E] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  ✏ 修正する
                </button>
                <button onClick={() => window.print()} className="bg-[#B8860B] hover:bg-[#8B6508] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  🖨 PDF出力
                </button>
              </div>
            </div>

            {/* カテゴリ別に表示 */}
            {CATEGORY_ORDER.filter(cat => estimate.items.some(i => i.category === cat)).map(cat => (
              <div key={cat} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[cat] ?? 'bg-gray-100 text-gray-600'}`}>{cat}</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {estimate.items.filter(i => i.category === cat).map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-3 py-2 text-gray-700">{item.product_name}</td>
                        <td className="px-3 py-2 text-gray-400 text-right w-20">{item.quantity}点</td>
                        <td className="px-3 py-2 text-gray-400 text-right w-28">{item.unit_price.toLocaleString()}円</td>
                        <td className="px-3 py-2 text-xs text-gray-300 w-16">{item.tax_type}</td>
                        <td className="px-3 py-2 font-medium text-[#2B3A4E] text-right w-28">{item.amount.toLocaleString()}円</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* 合計 */}
            <div className="border-t border-gray-200 pt-5 mt-5 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>小計（税抜）</span><span>{yen(totals!.subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>消費税</span><span>{yen(totals!.tax)}</span></div>
                {estimate.discount > 0 && (
                  <div className="flex justify-between text-gray-500"><span>割引</span><span className="text-red-500">-{yen(estimate.discount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-[#2B3A4E] text-lg border-t border-gray-200 pt-3">
                  <span>お見積り合計</span><span>{yen(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 他機能へのリンクカード */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { href: `/documents/${params.id}`,  icon: '📄', label: '書類生成',  desc: '訃報文・会葬礼状・式次第', color: 'hover:border-teal-300 hover:bg-teal-50' },
            { href: `/settlement/${params.id}`,  icon: '💴', label: '精算・請求', desc: '実績入力・差額計算・請求書', color: 'hover:border-orange-300 hover:bg-orange-50' },
            { href: `/kouden/${params.id}`,      icon: '📒', label: '香典帳',   desc: '香典入力・返礼品計算',     color: 'hover:border-pink-300 hover:bg-pink-50' },
            { href: `/procedures/${params.id}`,  icon: '✅', label: '手続きリスト', desc: '各種届出・手続きチェック', color: 'hover:border-purple-300 hover:bg-purple-50' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-white border border-gray-100 rounded-xl p-5 shadow-sm transition-colors ${item.color} group`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-medium text-[#2B3A4E] text-sm mb-1">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
