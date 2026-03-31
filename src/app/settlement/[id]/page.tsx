'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCases, getEstimatesByCaseId, calcTotals } from '@/lib/data'
import type { Case, Estimate, EstimateItem } from '@/lib/types'

interface ActualItem extends EstimateItem {
  actual_quantity: number
  actual_amount: number
}

function yen(n: number) { return n.toLocaleString('ja-JP') + '円' }
function diff(a: number, b: number) {
  const d = a - b
  if (d === 0) return <span className="text-gray-400">—</span>
  if (d > 0) return <span className="text-red-500">+{yen(d)}</span>
  return <span className="text-green-600">{yen(d)}</span>
}

export default function SettlementPage({ params }: { params: { id: string } }) {
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [actuals, setActuals] = useState<ActualItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setMounted(true)
    const c = getCases().find(c => c.id === params.id) ?? null
    setCaseData(c)
    if (c) {
      const ests = getEstimatesByCaseId(c.id)
      const est = ests[ests.length - 1] ?? null
      setEstimate(est)
      if (est) {
        setActuals(est.items.map(item => ({
          ...item,
          actual_quantity: item.quantity,
          actual_amount: item.amount,
        })))
      }
    }
  }, [params.id])

  if (!mounted) return null
  if (!caseData) return (
    <div className="p-8">
      <p className="text-gray-400 mb-2">案件が見つかりません</p>
      <Link href="/dashboard" className="text-[#B8860B] text-sm">← ダッシュボードへ</Link>
    </div>
  )

  if (!estimate) return (
    <div className="p-8">
      <Link href={`/estimate/${params.id}`} className="text-gray-400 text-xs hover:text-gray-600 mb-6 inline-block">← 案件詳細へ</Link>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-4xl mb-4">📋</p>
        <p className="text-gray-500 font-medium mb-2">見積もりがまだ作成されていません</p>
        <Link href="/estimate/new" className="bg-[#B8860B] text-white px-6 py-2.5 rounded-lg text-sm font-medium inline-block mt-2">
          見積もりを作成する
        </Link>
      </div>
    </div>
  )

  const updateActual = (idx: number, qty: number) => {
    setActuals(prev => prev.map((item, i) => {
      if (i !== idx) return item
      return { ...item, actual_quantity: qty, actual_amount: item.unit_price * qty }
    }))
  }

  const estimateTotals = calcTotals(estimate.items)
  const actualTotals = calcTotals(actuals.map(a => ({ ...a, quantity: a.actual_quantity, amount: a.actual_amount })))
  const diffTotal = actualTotals.total - estimateTotals.total

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <Link href={`/estimate/${params.id}`} className="text-gray-400 text-xs hover:text-gray-600">← 案件詳細へ戻る</Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-xl font-bold text-[#2B3A4E]">精算・請求</h1>
          <span className="text-gray-400 text-sm">— {caseData.deceased_name} 様</span>
        </div>
      </div>

      <div className="p-8 max-w-5xl">
        {/* 差額サマリー */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: '見積もり合計', value: estimateTotals.total - (estimate.discount ?? 0), color: 'text-[#2B3A4E]' },
            { label: '実績合計', value: actualTotals.total, color: 'text-[#2B3A4E]' },
            { label: '差額', value: diffTotal, color: diffTotal > 0 ? 'text-red-500' : diffTotal < 0 ? 'text-green-600' : 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>
                {s.value > 0 ? '+' : ''}{s.value !== 0 ? yen(Math.abs(s.value)) : '—'}
                {s.label === '差額' && diffTotal !== 0 && (
                  <span className="text-sm font-normal ml-2 text-gray-400">
                    {diffTotal > 0 ? '（追加請求）' : '（返金）'}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* 比較表 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#2B3A4E]">見積もり vs 実績 比較</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSaved(true)}
                className="bg-[#2B3A4E] hover:bg-[#1E2A3A] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                実績を保存
              </button>
              <button onClick={() => window.print()} className="bg-[#B8860B] hover:bg-[#8B6508] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                🖨 請求書PDF
              </button>
            </div>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-green-700 text-sm">
              ✓ 実績データを保存しました
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs text-gray-400">商品名</th>
                <th className="px-4 py-2.5 text-center text-xs text-gray-400">見積数量</th>
                <th className="px-4 py-2.5 text-right text-xs text-gray-400">見積金額</th>
                <th className="px-4 py-2.5 text-center text-xs text-gray-400 bg-blue-50">実績数量</th>
                <th className="px-4 py-2.5 text-right text-xs text-gray-400 bg-blue-50">実績金額</th>
                <th className="px-4 py-2.5 text-right text-xs text-gray-400">差額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {actuals.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{item.product_name}</p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{yen(item.amount)}</td>
                  <td className="px-4 py-3 bg-blue-50/30">
                    <input
                      type="number"
                      min="0"
                      value={item.actual_quantity}
                      onChange={e => updateActual(idx, parseInt(e.target.value) || 0)}
                      className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 mx-auto block"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#2B3A4E] bg-blue-50/30">
                    {yen(item.actual_amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {diff(item.actual_amount, item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td className="px-4 py-3 text-[#2B3A4E]">合計</td>
                <td />
                <td className="px-4 py-3 text-right text-gray-700">{yen(estimateTotals.total)}</td>
                <td className="px-4 py-3 bg-blue-50/50" />
                <td className="px-4 py-3 text-right text-[#2B3A4E] bg-blue-50/50">{yen(actualTotals.total)}</td>
                <td className={`px-4 py-3 text-right ${diffTotal > 0 ? 'text-red-500' : diffTotal < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {diffTotal !== 0 ? `${diffTotal > 0 ? '+' : ''}${yen(diffTotal)}` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 請求書プレビュー（印刷用） */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-8 print-area">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A4E] mb-1">請　求　書</h2>
            <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex justify-between mb-8">
            <div>
              <p className="font-bold text-[#2B3A4E]">{caseData.chief_mourner_name} 様</p>
              <p className="text-gray-500 text-sm">故 {caseData.deceased_name} 様 葬儀費用</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">担当者：〇〇</p>
              <p className="text-xs text-gray-400">有効期限：発行日より30日</p>
            </div>
          </div>
          <div className="border-2 border-[#2B3A4E] rounded-lg p-6 text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">ご請求金額（税込）</p>
            <p className="text-4xl font-bold text-[#2B3A4E]">{yen(actualTotals.total)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
