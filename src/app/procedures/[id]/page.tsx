'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

interface ProcedureItem {
  id: string
  category: string
  title: string
  description: string
  deadline: string
  office: string
  documents: string[]
  priority: 'urgent' | 'normal' | 'low'
  done: boolean
  condition?: string // which attribute triggers this
}

interface CaseAttributes {
  hasPension: boolean
  hasRealEstate: boolean
  hasLifeInsurance: boolean
  hasBankAccount: boolean
  hasVehicle: boolean
  hasBusinessOwner: boolean
  hasHealthInsurance: boolean
  hasMycardNumber: boolean
}

const ATTR_LABELS: { key: keyof CaseAttributes; label: string; icon: string }[] = [
  { key: 'hasPension',       label: '年金受給者だった',   icon: '🏦' },
  { key: 'hasRealEstate',    label: '不動産を所有していた', icon: '🏠' },
  { key: 'hasLifeInsurance', label: '生命保険に加入していた', icon: '📋' },
  { key: 'hasBankAccount',   label: '銀行口座を持っていた', icon: '💳' },
  { key: 'hasVehicle',       label: '車を所有していた',   icon: '🚗' },
  { key: 'hasBusinessOwner', label: '事業を営んでいた',   icon: '🏢' },
  { key: 'hasHealthInsurance', label: '健康保険に加入していた', icon: '🏥' },
  { key: 'hasMycardNumber',  label: 'マイナンバーカードを持っていた', icon: '💳' },
]

const COMMON_PROCEDURES: ProcedureItem[] = [
  {
    id: 'death-certificate',
    category: '死亡届・火葬',
    title: '死亡届の提出',
    description: '死亡を知った日から7日以内に市区町村役場へ提出',
    deadline: '死亡から7日以内',
    office: '市区町村役場',
    documents: ['死亡診断書', '届出人の印鑑'],
    priority: 'urgent',
    done: false,
  },
  {
    id: 'cremation-permit',
    category: '死亡届・火葬',
    title: '火葬許可証の受け取り',
    description: '死亡届提出時に同時に申請。葬儀社が代行することが多い',
    deadline: '葬儀前',
    office: '市区町村役場',
    documents: ['死亡届（提出済み）'],
    priority: 'urgent',
    done: false,
  },
  {
    id: 'inheritance-check',
    category: '相続・遺産',
    title: '遺言書の有無の確認',
    description: '自筆証書遺言は家庭裁判所での検認が必要。公正証書遺言は不要',
    deadline: '速やかに',
    office: '家庭裁判所 / 法務局',
    documents: ['遺言書（発見した場合）'],
    priority: 'urgent',
    done: false,
  },
  {
    id: 'inheritance-limit',
    category: '相続・遺産',
    title: '相続放棄・限定承認の検討',
    description: '相続放棄は3ヶ月以内に家庭裁判所へ申述',
    deadline: '相続開始から3ヶ月以内',
    office: '家庭裁判所',
    documents: ['戸籍謄本', '住民票'],
    priority: 'normal',
    done: false,
  },
  {
    id: 'income-tax',
    category: '税務',
    title: '準確定申告',
    description: '故人が給与所得・事業所得等を得ていた場合、4ヶ月以内に相続人が申告',
    deadline: '相続開始から4ヶ月以内',
    office: '税務署',
    documents: ['源泉徴収票', '確定申告書等'],
    priority: 'normal',
    done: false,
  },
  {
    id: 'address-cancel',
    category: '行政手続き',
    title: '住民票の抹消（死亡届で自動処理）',
    description: '死亡届提出で市区町村が処理するため、別途手続き不要',
    deadline: '死亡届提出時',
    office: '市区町村役場',
    documents: [],
    priority: 'low',
    done: false,
  },
]

const CONDITIONAL_PROCEDURES: ProcedureItem[] = [
  // Pension
  {
    id: 'pension-stop',
    category: '年金',
    title: '年金受給停止の手続き',
    description: '死亡から14日以内（国民年金）または10日以内（厚生年金）に年金事務所へ届出',
    deadline: '死亡から14日以内',
    office: '年金事務所 / 市区町村役場',
    documents: ['年金証書', '死亡診断書', '戸籍謄本', '銀行通帳'],
    priority: 'urgent',
    done: false,
    condition: 'hasPension',
  },
  {
    id: 'pension-survivors',
    category: '年金',
    title: '遺族年金の請求',
    description: '配偶者・子どもがいる場合、遺族基礎年金・遺族厚生年金を請求できる場合あり',
    deadline: '5年以内（時効あり）',
    office: '年金事務所',
    documents: ['年金手帳', '戸籍謄本', '住民票', '所得証明書'],
    priority: 'normal',
    done: false,
    condition: 'hasPension',
  },
  // Real estate
  {
    id: 'real-estate-inherit',
    category: '不動産',
    title: '不動産の相続登記',
    description: '2024年4月より3年以内の相続登記が義務化。相続税申告期限（10ヶ月）までに登記を推奨',
    deadline: '相続開始から3年以内（義務）',
    office: '法務局',
    documents: ['遺産分割協議書', '戸籍謄本（全員）', '住民票', '固定資産税評価証明書'],
    priority: 'normal',
    done: false,
    condition: 'hasRealEstate',
  },
  // Life insurance
  {
    id: 'life-insurance-claim',
    category: '保険',
    title: '生命保険の死亡保険金請求',
    description: '保険会社所定の請求書類を提出。保険証書が見当たらない場合は生命保険協会の「保険契約照会制度」を利用',
    deadline: '3年以内（時効あり）',
    office: '各保険会社',
    documents: ['保険証書', '死亡診断書', '戸籍謄本', '受取人の本人確認書類'],
    priority: 'normal',
    done: false,
    condition: 'hasLifeInsurance',
  },
  // Bank account
  {
    id: 'bank-freeze',
    category: '金融機関',
    title: '銀行口座の相続手続き',
    description: '死亡連絡すると口座が凍結される。相続手続き完了後に払い戻し・名義変更',
    deadline: '速やかに（当面の生活費を引き出してから連絡が一般的）',
    office: '各金融機関',
    documents: ['戸籍謄本', '遺産分割協議書', '相続人全員の印鑑証明書'],
    priority: 'normal',
    done: false,
    condition: 'hasBankAccount',
  },
  // Vehicle
  {
    id: 'vehicle-transfer',
    category: '車・自動車',
    title: '車の名義変更（相続）',
    description: '相続後15日以内に移転登録の申請が必要',
    deadline: '相続から15日以内',
    office: '運輸支局',
    documents: ['車検証', '遺産分割協議書', '戸籍謄本', '印鑑証明書'],
    priority: 'urgent',
    done: false,
    condition: 'hasVehicle',
  },
  // Business
  {
    id: 'business-closure',
    category: '事業',
    title: '事業廃止・休業の届出',
    description: '個人事業主の場合、廃業届を税務署へ提出。青色申告承認申請の取り消しも必要',
    deadline: '廃業後1ヶ月以内',
    office: '税務署',
    documents: ['廃業届', '所得税の青色申告の取りやめ届出書'],
    priority: 'normal',
    done: false,
    condition: 'hasBusinessOwner',
  },
  // Health insurance
  {
    id: 'health-insurance-cancel',
    category: '健康保険',
    title: '健康保険証の返却',
    description: '国民健康保険の場合は市区町村役場へ返却。会社の健康保険は勤務先へ',
    deadline: '死亡から14日以内',
    office: '市区町村役場 / 勤務先',
    documents: ['健康保険証', '死亡診断書'],
    priority: 'urgent',
    done: false,
    condition: 'hasHealthInsurance',
  },
  // MyNumber
  {
    id: 'mynumber-cancel',
    category: '行政手続き',
    title: 'マイナンバーカードの返納',
    description: '市区町村役場へマイナンバーカードを返納する',
    deadline: '速やかに',
    office: '市区町村役場',
    documents: ['マイナンバーカード'],
    priority: 'low',
    done: false,
    condition: 'hasMycardNumber',
  },
]

const PRIORITY_STYLE = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-500',
}
const PRIORITY_LABEL = { urgent: '急ぎ', normal: '通常', low: '任意' }


const DEFAULT_ATTRS: CaseAttributes = {
  hasPension: false, hasRealEstate: false, hasLifeInsurance: false,
  hasBankAccount: true, hasVehicle: false, hasBusinessOwner: false,
  hasHealthInsurance: true, hasMycardNumber: false,
}

export default function ProceduresPage({ params }: { params: { id: string } }) {
  const caseId = params.id as Id<'cases'>
  const caseData = useQuery(api.cases.get, { id: caseId })
  const savedProc = useQuery(api.procedures.getByCase, { case_id: caseId })
  const upsertProc = useMutation(api.procedures.upsert)

  const [attrs, setAttrs] = useState<CaseAttributes>(DEFAULT_ATTRS)
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [step, setStep] = useState<'attrs' | 'list'>('attrs')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [hydrated, setHydrated] = useState(false)

  // Convexからデータが届いたら状態を初期化（一度だけ）
  useEffect(() => {
    if (savedProc !== undefined && !hydrated) {
      setHydrated(true)
      if (savedProc) {
        setAttrs(savedProc.attrs as CaseAttributes)
        setDone(savedProc.done as Record<string, boolean>)
        setStep('list')
      }
    }
  }, [savedProc, hydrated])

  if (caseData === undefined) return <div className="p-8 text-gray-400">読み込み中...</div>
  if (caseData === null) return (
    <div className="p-8">
      <p className="text-gray-400 mb-2">案件が見つかりません</p>
      <Link href="/dashboard" className="text-[#B8860B] text-sm">← ダッシュボードへ</Link>
    </div>
  )

  const activeProcedures: ProcedureItem[] = [
    ...COMMON_PROCEDURES,
    ...CONDITIONAL_PROCEDURES.filter(p => p.condition && attrs[p.condition as keyof CaseAttributes]),
  ]

  const withDone = activeProcedures.map(p => ({ ...p, done: done[p.id] ?? false }))
  const categories = ['all', ...Array.from(new Set(withDone.map(p => p.category)))]
  const filtered = filterCat === 'all' ? withDone : withDone.filter(p => p.category === filterCat)

  const doneCount = withDone.filter(p => p.done).length
  const progress = withDone.length > 0 ? Math.round((doneCount / withDone.length) * 100) : 0
  const urgentUndone = withDone.filter(p => p.priority === 'urgent' && !p.done)

  const toggleDone = async (id: string) => {
    const updated = { ...done, [id]: !done[id] }
    setDone(updated)
    await upsertProc({ case_id: caseId, attrs, done: updated })
  }

  const handleConfirmAttrs = async () => {
    await upsertProc({ case_id: caseId, attrs, done })
    setStep('list')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <Link href={`/estimate/${params.id}`} className="text-gray-400 text-xs hover:text-gray-600">← 案件詳細へ戻る</Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-xl font-bold text-[#2B3A4E]">手続きリスト</h1>
          <span className="text-gray-400 text-sm">— {caseData.deceased_name} 様</span>
        </div>
      </div>

      <div className="p-8 max-w-4xl">
        {step === 'attrs' ? (
          /* 属性選択ステップ */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-[#2B3A4E] mb-2">故人の状況を教えてください</h2>
            <p className="text-sm text-gray-400 mb-6">当てはまる項目を選択すると、必要な手続きをリストアップします</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {ATTR_LABELS.map(attr => (
                <button
                  key={attr.key}
                  onClick={() => setAttrs(a => ({ ...a, [attr.key]: !a[attr.key] }))}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    attrs[attr.key]
                      ? 'border-[#B8860B] bg-[#B8860B]/5 text-[#2B3A4E]'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{attr.icon}</span>
                  <span className="text-sm font-medium">{attr.label}</span>
                  {attrs[attr.key] && <span className="ml-auto text-[#B8860B] text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {[...COMMON_PROCEDURES, ...CONDITIONAL_PROCEDURES.filter(p => p.condition && attrs[p.condition as keyof CaseAttributes])].length}件の手続きが必要です
              </p>
              <button
                onClick={handleConfirmAttrs}
                className="bg-[#2B3A4E] hover:bg-[#1E2A3A] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                手続きリストを作成 →
              </button>
            </div>
          </div>
        ) : (
          /* 手続きリスト */
          <>
            {/* 進捗 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-[#2B3A4E]">完了状況</p>
                  <p className="text-sm text-gray-400">{doneCount}/{withDone.length}件完了</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-[#B8860B]">{progress}%</span>
                  <button
                    onClick={() => setStep('attrs')}
                    className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    条件を変更
                  </button>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#B8860B] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 急ぎアラート */}
            {urgentUndone.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-sm font-bold mb-2">⚠ 期限の近い手続きがあります</p>
                <ul className="space-y-1">
                  {urgentUndone.map(p => (
                    <li key={p.id} className="text-red-600 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block" />
                      {p.title} — {p.deadline}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* カテゴリフィルター */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterCat === cat
                      ? 'bg-[#2B3A4E] text-white'
                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {cat === 'all' ? 'すべて' : cat}
                </button>
              ))}
            </div>

            {/* 手続きカード */}
            <div className="space-y-3">
              {filtered.map(proc => (
                <div
                  key={proc.id}
                  className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
                    proc.done ? 'border-gray-100 opacity-60' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleDone(proc.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        proc.done
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {proc.done && <span className="text-xs">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLE[proc.priority]}`}>
                          {PRIORITY_LABEL[proc.priority]}
                        </span>
                        <span className="text-xs text-gray-400">{proc.category}</span>
                        {proc.done && <span className="text-xs text-green-600 font-medium">完了</span>}
                      </div>
                      <p className={`font-medium text-sm ${proc.done ? 'line-through text-gray-400' : 'text-[#2B3A4E]'}`}>
                        {proc.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{proc.description}</p>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>🗓</span>
                          <span>{proc.deadline}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>📍</span>
                          <span>{proc.office}</span>
                        </div>
                      </div>
                      {proc.documents.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {proc.documents.map(doc => (
                            <span key={doc} className="bg-gray-50 border border-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded">
                              {doc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => window.print()} className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition-colors">
                🖨 リストを印刷
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
