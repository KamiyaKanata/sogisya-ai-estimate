'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCases } from '@/lib/data'
import type { Case } from '@/lib/types'

// 宗派NGワードと置換マッピング
const SECT_NG_WORDS: Record<string, { ng: string[]; replace: Record<string, string> }> = {
  '浄土真宗本願寺派': {
    ng: ['冥福', '成仏', '供養', '往生を遂げ', '合掌'],
    replace: { '冥福': 'ご安堵', '成仏': '往生', '供養': 'ご回向', '合掌': 'なむあみだぶつ' },
  },
  '浄土真宗大谷派': {
    ng: ['冥福', '成仏', '供養', '合掌'],
    replace: { '冥福': 'ご安堵', '成仏': '往生', '供養': 'ご回向', '合掌': 'なむあみだぶつ' },
  },
}

function checkNGWords(text: string, sect: string): { text: string; warnings: string[] } {
  const rule = SECT_NG_WORDS[sect]
  if (!rule) return { text, warnings: [] }
  const warnings: string[] = []
  let result = text
  for (const ng of rule.ng) {
    if (result.includes(ng)) {
      warnings.push(`「${ng}」は${sect}では使用しません → 「${rule.replace[ng] ?? ''}」に変更しました`)
      result = result.replaceAll(ng, rule.replace[ng] ?? ng)
    }
  }
  return { text: result, warnings }
}

// ルールベースの文書生成（APIキーなし時のフォールバック）
function generateObituary(c: Case): string {
  const deathDate = c.date_of_death ? new Date(c.date_of_death).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '●月●日'
  const funeralDate = c.funeral_date ? new Date(c.funeral_date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '●月●日'
  return `訃　報

　${c.chief_mourner_name}の父（続柄）、${c.deceased_name}は、${deathDate}に永眠いたしました。

　享年　●●歳

　葬儀・告別式は下記のとおり執り行います。

記

■ 告別式
　日時：${funeralDate}
　場所：${c.venue_name || '〇〇式場'}
　住所：〇〇市〇〇町〇〇番地

■ 喪主
　${c.chief_mourner_name}
　連絡先：${c.chief_mourner_phone || '〇〇-〇〇〇〇-〇〇〇〇'}

尚、ご参列はご遠慮なく、ご案内申し上げます。

　　　　　　　　　　　　${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}`
}

function generateCondolenceLetter(c: Case): string {
  return `会　葬　御　礼

先日は故 ${c.deceased_name} の葬儀に際しまして
ご丁寧にご弔問いただき誠にありがとうございました

生前中のご厚情に深く感謝申し上げますとともに
謹んでお礼を申し上げます

なお略儀ながら書中をもってご挨拶申し上げます

${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}

　　喪主　${c.chief_mourner_name}`
}

function generateCeremonyOrder(c: Case): string {
  const isJodo = c.sect?.includes('浄土真宗')
  const isBuddha = c.religion === '仏教'
  if (c.ceremony_type === '直葬') {
    return `火葬式　式次第

一、開　式
一、ご遺族・ご会葬者着席
一、読　経　（${c.sect || ''}）
一、ご焼香
一、閉　式
一、出棺`
  }
  if (!isBuddha) {
    return `告別式　式次第

一、開　式
一、ご遺族・ご会葬者着席
一、ご挨拶
一、黙　祷
一、献　花
一、お別れ
一、閉　式
一、出棺`
  }
  return `告別式　式次第

一、開　式
一、ご遺族・ご会葬者着席
${isJodo ? '一、お　念　仏\n' : '一、読　経\n'}一、ご焼香（ご遺族・ご会葬者）
一、ご挨拶　（喪主 ${c.chief_mourner_name} 様）
一、お別れ・ご収棺
一、閉　式
一、出棺`
}

type DocType = 'obituary' | 'condolence' | 'ceremony'

interface GeneratedDoc {
  type: DocType
  text: string
  warnings: string[]
}

export default function DocumentsPage({ params }: { params: { id: string } }) {
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [mounted, setMounted] = useState(false)
  const [generating, setGenerating] = useState<DocType | null>(null)
  const [docs, setDocs] = useState<Partial<Record<DocType, GeneratedDoc>>>({})
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null)

  useEffect(() => {
    setMounted(true)
    const c = getCases().find(c => c.id === params.id) ?? null
    setCaseData(c)
  }, [params.id])

  if (!mounted) return null
  if (!caseData) return (
    <div className="p-8">
      <p className="text-gray-400 mb-2">案件が見つかりません</p>
      <Link href="/dashboard" className="text-[#B8860B] text-sm">← ダッシュボードへ</Link>
    </div>
  )

  const generate = async (type: DocType) => {
    setGenerating(type)
    setActiveDoc(type)
    try {
      // Claude APIを試みる
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, caseData }),
      })
      if (res.ok) {
        const data = await res.json() as { text: string }
        const checked = checkNGWords(data.text, caseData.sect)
        setDocs(prev => ({ ...prev, [type]: { type, text: checked.text, warnings: checked.warnings } }))
      } else {
        throw new Error('API failed')
      }
    } catch {
      // フォールバック（ルールベース）
      const raw = type === 'obituary' ? generateObituary(caseData)
        : type === 'condolence' ? generateCondolenceLetter(caseData)
        : generateCeremonyOrder(caseData)
      const checked = checkNGWords(raw, caseData.sect)
      setDocs(prev => ({ ...prev, [type]: { type, text: checked.text, warnings: checked.warnings } }))
    } finally {
      setGenerating(null)
    }
  }

  const DOC_DEFS: { type: DocType; icon: string; label: string; desc: string }[] = [
    { type: 'obituary',   icon: '📰', label: '訃報文',    desc: '逝去と葬儀日程のご案内文' },
    { type: 'condolence', icon: '💌', label: '会葬御礼状', desc: '参列者へのお礼状' },
    { type: 'ceremony',   icon: '📋', label: '式次第',    desc: '告別式の進行プログラム' },
  ]

  const currentDoc = activeDoc ? docs[activeDoc] : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <Link href={`/estimate/${params.id}`} className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
          ← 案件詳細へ戻る
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-xl font-bold text-[#2B3A4E]">書類生成</h1>
          <span className="text-gray-400 text-sm">— {caseData.deceased_name} 様</span>
        </div>
      </div>

      <div className="p-8 flex gap-6">
        {/* 左：書類選択 */}
        <div className="w-56 shrink-0 space-y-3">
          {DOC_DEFS.map(def => (
            <div key={def.type} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="text-2xl mb-1">{def.icon}</div>
                <p className="font-medium text-[#2B3A4E] text-sm">{def.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{def.desc}</p>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => generate(def.type)}
                  disabled={generating === def.type}
                  className="flex-1 bg-[#2B3A4E] hover:bg-[#1E2A3A] text-white py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {generating === def.type ? (
                    <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中...</>
                  ) : docs[def.type] ? '再生成' : '生成する'}
                </button>
                {docs[def.type] && (
                  <button
                    onClick={() => setActiveDoc(def.type)}
                    className={`px-2 py-2 rounded-lg text-xs transition-colors border ${activeDoc === def.type ? 'bg-[#B8860B] text-white border-[#B8860B]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    表示
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="bg-[#2B3A4E]/5 rounded-xl p-4 text-xs text-[#2B3A4E]/70 space-y-1">
            <p className="font-medium">宗派NGワード自動チェック</p>
            <p>宗派に応じて不適切な表現を自動で検出・修正します</p>
            {caseData.sect && (
              <p className="mt-2 font-medium text-[#B8860B]">対象宗派：{caseData.sect}</p>
            )}
          </div>
        </div>

        {/* 右：プレビュー */}
        <div className="flex-1">
          {!currentDoc ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
              <p className="text-4xl mb-4">📄</p>
              <p className="text-gray-400 font-medium">左の「生成する」ボタンを押すと文書が作成されます</p>
              <p className="text-gray-300 text-sm mt-1">訃報文・会葬御礼状・式次第を自動生成します</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              {/* 警告バナー */}
              {currentDoc.warnings.length > 0 && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
                  <p className="text-amber-800 text-xs font-medium mb-1">⚠ 宗派NGワードを自動修正しました</p>
                  {currentDoc.warnings.map((w, i) => (
                    <p key={i} className="text-amber-700 text-xs">{w}</p>
                  ))}
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-[#2B3A4E]">
                    {DOC_DEFS.find(d => d.type === activeDoc)?.label}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const el = document.getElementById('doc-preview')
                        if (el) {
                          const original = document.title
                          document.title = `${DOC_DEFS.find(d => d.type === activeDoc)?.label}_${caseData.deceased_name}`
                          window.print()
                          document.title = original
                        }
                      }}
                      className="border border-[#2B3A4E] text-[#2B3A4E] hover:bg-[#2B3A4E] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🖨 PDF出力
                    </button>
                  </div>
                </div>
                <div
                  id="doc-preview"
                  className="bg-gray-50 rounded-lg p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 min-h-64 border border-gray-200"
                >
                  {currentDoc.text}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
