'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCases } from '@/lib/data'
import type { Case } from '@/lib/types'

interface KoudenEntry {
  id: string
  name: string
  kana: string
  amount: number
  relation: string
  address: string
  note: string
  returned: boolean
  return_amount: number
}

const RELATIONS = ['会社関係', '親族', '友人・知人', '近隣', 'その他']

function yen(n: number) { return n.toLocaleString('ja-JP') + '円' }

function calcReturn(amount: number): number {
  // 半返し: return approx 1/3〜1/2 (typically ~1/3 for large amounts, 1/2 for smaller)
  if (amount >= 30000) return Math.floor(amount / 3 / 100) * 100
  return Math.floor(amount / 2 / 100) * 100
}

const STORAGE_KEY = (id: string) => `kouden_${id}`

function loadEntries(caseId: string): KoudenEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(caseId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEntries(caseId: string, entries: KoudenEntry[]) {
  localStorage.setItem(STORAGE_KEY(caseId), JSON.stringify(entries))
}

const BLANK: Omit<KoudenEntry, 'id'> = {
  name: '', kana: '', amount: 0, relation: '親族', address: '', note: '', returned: false, return_amount: 0,
}

export default function KoudenPage({ params }: { params: { id: string } }) {
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [entries, setEntries] = useState<KoudenEntry[]>([])
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState({ ...BLANK })
  const [editId, setEditId] = useState<string | null>(null)
  const [filterRelation, setFilterRelation] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [sortBy, setSortBy] = useState<'amount' | 'name'>('amount')

  useEffect(() => {
    setMounted(true)
    const c = getCases().find(c => c.id === params.id) ?? null
    setCaseData(c)
    if (c) setEntries(loadEntries(c.id))
  }, [params.id])

  if (!mounted) return null
  if (!caseData) return (
    <div className="p-8">
      <p className="text-gray-400 mb-2">案件が見つかりません</p>
      <Link href="/dashboard" className="text-[#B8860B] text-sm">← ダッシュボードへ</Link>
    </div>
  )

  const saveAll = (updated: KoudenEntry[]) => {
    setEntries(updated)
    saveEntries(caseData.id, updated)
  }

  const handleSubmit = () => {
    if (!form.name || form.amount <= 0) return
    const returnAmt = calcReturn(form.amount)
    if (editId) {
      saveAll(entries.map(e => e.id === editId ? { ...form, id: editId, return_amount: returnAmt } : e))
      setEditId(null)
    } else {
      const newEntry: KoudenEntry = {
        ...form,
        id: crypto.randomUUID(),
        return_amount: returnAmt,
      }
      saveAll([...entries, newEntry])
    }
    setForm({ ...BLANK })
    setShowForm(false)
  }

  const startEdit = (entry: KoudenEntry) => {
    setForm({ name: entry.name, kana: entry.kana, amount: entry.amount, relation: entry.relation, address: entry.address, note: entry.note, returned: entry.returned, return_amount: entry.return_amount })
    setEditId(entry.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteEntry = (id: string) => {
    if (!confirm('この記録を削除しますか？')) return
    saveAll(entries.filter(e => e.id !== id))
  }

  const toggleReturned = (id: string) => {
    saveAll(entries.map(e => e.id === id ? { ...e, returned: !e.returned } : e))
  }

  const filtered = entries.filter(e => filterRelation === 'all' || e.relation === filterRelation)
  const sorted = [...filtered].sort((a, b) => sortBy === 'amount' ? b.amount - a.amount : a.name.localeCompare(b.name, 'ja'))

  const total = entries.reduce((s, e) => s + e.amount, 0)
  const totalReturn = entries.reduce((s, e) => s + e.return_amount, 0)
  const returnedCount = entries.filter(e => e.returned).length
  const unreturned = entries.filter(e => !e.returned)
  const unreturnedTotal = unreturned.reduce((s, e) => s + e.return_amount, 0)

  const byRelation = RELATIONS.map(r => ({
    relation: r,
    count: entries.filter(e => e.relation === r).length,
    total: entries.filter(e => e.relation === r).reduce((s, e) => s + e.amount, 0),
  })).filter(r => r.count > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <Link href={`/estimate/${params.id}`} className="text-gray-400 text-xs hover:text-gray-600">← 案件詳細へ戻る</Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#2B3A4E]">香典帳</h1>
            <span className="text-gray-400 text-sm">— {caseData.deceased_name} 様</span>
          </div>
          <button
            onClick={() => { setForm({ ...BLANK }); setEditId(null); setShowForm(true) }}
            className="bg-[#B8860B] hover:bg-[#8B6508] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ＋ 香典を記録
          </button>
        </div>
      </div>

      <div className="p-8 max-w-5xl">
        {/* 入力フォーム */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-[#2B3A4E] mb-4">
              {editId ? '香典情報を編集' : '香典を記録する'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">お名前 <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="山田 花子"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">フリガナ</label>
                <input
                  value={form.kana}
                  onChange={e => setForm(f => ({ ...f, kana: e.target.value }))}
                  placeholder="ヤマダ ハナコ"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">香典金額 <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.amount || ''}
                    onChange={e => setForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                    placeholder="5000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
                </div>
                {form.amount > 0 && (
                  <p className="text-xs text-[#B8860B] mt-1">
                    香典返し目安: {yen(calcReturn(form.amount))}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">ご関係</label>
                <select
                  value={form.relation}
                  onChange={e => setForm(f => ({ ...f, relation: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                >
                  {RELATIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium block mb-1">ご住所</label>
                <input
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="東京都〇〇区〇〇 1-2-3"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium block mb-1">備考</label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="供花あり など"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSubmit}
                disabled={!form.name || form.amount <= 0}
                className="bg-[#2B3A4E] hover:bg-[#1E2A3A] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              >
                {editId ? '更新する' : '記録する'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm({ ...BLANK }) }}
                className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* サマリーカード */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: '総香典件数', value: `${entries.length}件`, sub: '' },
            { label: '香典総額', value: yen(total), sub: '' },
            { label: '香典返し合計', value: yen(totalReturn), sub: '（半返し目安）' },
            { label: '返礼未済', value: `${entries.length - returnedCount}件`, sub: unreturnedTotal > 0 ? yen(unreturnedTotal) : '' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-[#2B3A4E]">{s.value}</p>
              {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* 関係別集計 */}
        {byRelation.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <h3 className="text-sm font-bold text-[#2B3A4E] mb-3">関係別集計</h3>
            <div className="flex flex-wrap gap-3">
              {byRelation.map(r => (
                <div key={r.relation} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
                  <span className="text-gray-500">{r.relation}</span>
                  <span className="ml-2 font-medium text-[#2B3A4E]">{r.count}件</span>
                  <span className="ml-1 text-gray-400">/ {yen(r.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 一覧 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#2B3A4E]">香典一覧</h2>
            <div className="flex items-center gap-3">
              <select
                value={filterRelation}
                onChange={e => setFilterRelation(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30"
              >
                <option value="all">全ての関係</option>
                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'amount' | 'name')}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30"
              >
                <option value="amount">金額順</option>
                <option value="name">名前順</option>
              </select>
              <button onClick={() => window.print()} className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs transition-colors">
                🖨 印刷
              </button>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-3">香</p>
              <p className="text-gray-400 font-medium">香典の記録がありません</p>
              <p className="text-gray-300 text-sm mt-1">「香典を記録」ボタンから入力してください</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs text-gray-400 font-medium">お名前</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-400 font-medium">関係</th>
                  <th className="px-5 py-3 text-right text-xs text-gray-400 font-medium">香典金額</th>
                  <th className="px-5 py-3 text-right text-xs text-gray-400 font-medium">返礼目安</th>
                  <th className="px-5 py-3 text-center text-xs text-gray-400 font-medium">返礼済</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-400 font-medium">備考</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(entry => (
                  <tr key={entry.id} className={`hover:bg-gray-50/50 transition-colors ${entry.returned ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#2B3A4E]">{entry.name}</p>
                      {entry.kana && <p className="text-xs text-gray-400">{entry.kana}</p>}
                      {entry.address && <p className="text-xs text-gray-300">{entry.address}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {entry.relation}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-[#2B3A4E]">{yen(entry.amount)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{yen(entry.return_amount)}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggleReturned(entry.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-colors ${
                          entry.returned
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                        title={entry.returned ? '返礼済み' : '未返礼（クリックでマーク）'}
                      >
                        {entry.returned && <span className="text-xs">✓</span>}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{entry.note}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(entry)} className="text-xs text-gray-400 hover:text-[#2B3A4E] px-2 py-1 rounded hover:bg-gray-100 transition-colors">編集</button>
                        <button onClick={() => deleteEntry(entry.id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <td className="px-5 py-3 text-[#2B3A4E]">合計 {filtered.length}件</td>
                  <td />
                  <td className="px-5 py-3 text-right text-[#2B3A4E]">{yen(filtered.reduce((s, e) => s + e.amount, 0))}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{yen(filtered.reduce((s, e) => s + e.return_amount, 0))}</td>
                  <td />
                  <td />
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* 香典返し未済リスト */}
        {unreturned.length > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-amber-800 text-sm font-bold mb-3">⚠ 香典返し未済 — {unreturned.length}件 / 合計 {yen(unreturnedTotal)}</p>
            <div className="space-y-1">
              {unreturned.slice(0, 5).map(e => (
                <div key={e.id} className="flex justify-between text-sm text-amber-700">
                  <span>{e.name}様</span>
                  <span>{yen(e.return_amount)}</span>
                </div>
              ))}
              {unreturned.length > 5 && (
                <p className="text-xs text-amber-600">他 {unreturned.length - 5}件...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
