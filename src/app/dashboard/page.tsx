'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCases } from '@/lib/data'
import type { Case, Status } from '@/lib/types'

const ALL_STATUSES: Status[] = ['相談中', '見積済', '施行中', '完了', '精算済']

const STATUS_STYLE: Record<Status, string> = {
  '相談中': 'bg-amber-100 text-amber-800',
  '見積済': 'bg-blue-100 text-blue-800',
  '施行中': 'bg-emerald-100 text-emerald-800',
  '完了':   'bg-gray-100 text-gray-600',
  '精算済': 'bg-purple-100 text-purple-800',
}

const CEREMONY_STYLE: Record<string, string> = {
  '一般葬': 'bg-slate-100 text-slate-700',
  '家族葬': 'bg-sky-100 text-sky-700',
  '一日葬': 'bg-orange-100 text-orange-700',
  '直葬':   'bg-rose-100 text-rose-700',
}

// 各機能のクイックアクション定義
const QUICK_ACTIONS = [
  { icon: '¥',  label: '見積もり', href: (id: string) => `/estimate/${id}`,    color: 'hover:bg-blue-50 hover:text-blue-700',   tip: '見積もりを確認・修正' },
  { icon: '📄', label: '書類',    href: (id: string) => `/documents/${id}`,   color: 'hover:bg-teal-50 hover:text-teal-700',   tip: '訃報文・会葬礼状を生成' },
  { icon: '精', label: '精算',    href: (id: string) => `/settlement/${id}`,  color: 'hover:bg-orange-50 hover:text-orange-700', tip: '精算・請求書を作成' },
  { icon: '香', label: '香典',    href: (id: string) => `/kouden/${id}`,      color: 'hover:bg-pink-50 hover:text-pink-700',   tip: '香典帳を管理' },
  { icon: '✓',  label: '手続き', href: (id: string) => `/procedures/${id}`,  color: 'hover:bg-purple-50 hover:text-purple-700', tip: '手続きリストを確認' },
]

function fmt(date: string) {
  return new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
}

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [active, setActive] = useState<Status | 'all'>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCases(getCases())
  }, [])

  if (!mounted) return null

  const filtered = active === 'all' ? cases : cases.filter(c => c.status === active)
  const activeCases = cases.filter(c => ['相談中', '見積済', '施行中'].includes(c.status))
  const now = new Date()
  const thisMonth = cases.filter(c => {
    const d = new Date(c.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2B3A4E]">施行一覧</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/estimate/compare"
            className="border border-[#2B3A4E] text-[#2B3A4E] hover:bg-[#2B3A4E] hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            ≡ プラン比較
          </Link>
          <Link
            href="/estimate/new"
            className="bg-[#B8860B] hover:bg-[#8B6508] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            ＋ 新規作成
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: '対応中', value: activeCases.length, sub: '件' },
          { label: '今月の新規', value: thisMonth.length, sub: '件' },
          { label: '総施行件数', value: cases.length, sub: '件' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-[#2B3A4E]">
              {s.value}<span className="text-sm font-normal text-gray-400 ml-1">{s.sub}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 機能ガイド */}
      <div className="bg-[#2B3A4E]/5 border border-[#2B3A4E]/10 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-[#B8860B] text-lg mt-0.5">💡</span>
        <div className="text-sm text-[#2B3A4E]">
          <strong>使い方：</strong>各案件行の右側にあるボタンから「見積もり・書類・精算・香典・手続き」を直接操作できます。
          案件名をクリックすると詳細ページで全機能をまとめて利用できます。
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          <button
            onClick={() => setActive('all')}
            className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active === 'all' ? 'border-[#B8860B] text-[#B8860B]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            すべて ({cases.length})
          </button>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active === s ? 'border-[#B8860B] text-[#B8860B]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {s} ({cases.filter(c => c.status === s).length})
            </button>
          ))}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">故人名</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">喪主名</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">形式</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">逝去日</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">ステータス</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">クイック操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-gray-300 text-sm">
                  該当する施行がありません
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/estimate/${c.id}`} className="hover:text-[#B8860B] transition-colors">
                      <p className="font-medium text-[#2B3A4E]">{c.deceased_name}</p>
                      <p className="text-xs text-gray-400">{c.deceased_kana}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{c.chief_mourner_name}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CEREMONY_STYLE[c.ceremony_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.ceremony_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-sm">{fmt(c.date_of_death)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {QUICK_ACTIONS.map(action => (
                        <Link
                          key={action.label}
                          href={action.href(c.id)}
                          title={action.tip}
                          className={`flex flex-col items-center px-2 py-1 rounded-lg text-gray-400 transition-colors text-xs ${action.color}`}
                        >
                          <span className="text-sm leading-none mb-0.5">{action.icon}</span>
                          <span>{action.label}</span>
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
