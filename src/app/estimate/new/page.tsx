'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { SEED_PRODUCTS, addCase, addEstimate, calcTotals } from '@/lib/data'
import type { CeremonyType, Religion, EstimateItem, ProductCategory, BudgetPreference } from '@/lib/types'

// ---- types ----
interface FormData {
  deceased_name: string
  deceased_kana: string
  chief_mourner_name: string
  chief_mourner_phone: string
  chief_mourner_address: string
  date_of_death: string
  religion: Religion
  sect: string
  ceremony_type: CeremonyType
  expected_attendees: string
  budget_preference: BudgetPreference
  venue_name: string
  wake_date: string
  funeral_date: string
  cremation_date: string
}

const EMPTY_FORM: FormData = {
  deceased_name: '', deceased_kana: '', chief_mourner_name: '', chief_mourner_phone: '',
  chief_mourner_address: '', date_of_death: '', religion: '仏教', sect: '',
  ceremony_type: '家族葬', expected_attendees: '30', budget_preference: 'standard',
  venue_name: '', wake_date: '', funeral_date: '', cremation_date: '',
}

const TAX_RATE: Record<string, number> = { '課税10%': 0.1, '課税8%': 0.08, '非課税': 0 }

const CATEGORY_ORDER: ProductCategory[] = ['祭壇', '棺', '骨壺', '運営', '料理', '返礼品', '車両', 'その他']

const CATEGORY_COLOR: Record<ProductCategory, string> = {
  '祭壇': 'bg-purple-100 text-purple-700',
  '棺':   'bg-amber-100 text-amber-700',
  '骨壺': 'bg-sky-100 text-sky-700',
  '運営': 'bg-teal-100 text-teal-700',
  '料理': 'bg-green-100 text-green-700',
  '返礼品': 'bg-pink-100 text-pink-700',
  '車両': 'bg-orange-100 text-orange-700',
  'その他': 'bg-gray-100 text-gray-600',
}

function yen(n: number) {
  return n.toLocaleString('ja-JP') + '円'
}

// ---- fallback suggestions ----
function getFallbackItems(form: FormData): EstimateItem[] {
  const attendees = parseInt(form.expected_attendees) || 30
  const isPremium = form.budget_preference === 'premium'
  const isEconomy = form.budget_preference === 'economy'
  const isDirect = form.ceremony_type === '直葬'
  const isIchinichiSo = form.ceremony_type === '一日葬'

  const find = (name: string) => SEED_PRODUCTS.find(p => p.name === name)
  const item = (p: ReturnType<typeof find>, qty: number): EstimateItem | null => {
    if (!p) return null
    return { category: p.category, product_name: p.name, quantity: qty, unit_price: p.price, tax_type: p.tax_type, amount: p.price * qty }
  }

  const results: EstimateItem[] = []
  const push = (name: string, qty: number) => { const i = item(find(name), qty); if (i) results.push(i) }

  if (!isDirect) {
    push(isPremium ? '花祭壇 L' : isEconomy ? '花祭壇 S' : '花祭壇 M', 1)
  }
  push(isPremium ? '彫刻棺' : isEconomy ? '布張棺（標準）' : '桐棺', 1)
  push(isPremium ? '大理石調 7寸' : '白磁 7寸', 1)

  if (!isDirect) {
    push('式場使用料（1日）', isIchinichiSo ? 1 : 2)
  }
  push('ドライアイス（1日）', isDirect ? 2 : 3)
  push('安置料（1日）', isDirect ? 2 : 3)
  push('運搬費（基本）', 1)
  push('遺影写真加工', isDirect ? 0 : 1)
  push('火葬料（市民）', 1)
  push('洋型霊柩車', 1)

  if (!isDirect) {
    if (!isIchinichiSo) push('通夜振る舞い（一人）', attendees)
    push('精進落とし（一人）', attendees)
    push('会葬御礼品', attendees)
  }

  return results.filter(r => r.quantity > 0 && r.unit_price >= 0)
}

// ---- step indicator ----
function StepIndicator({ step }: { step: number }) {
  const steps = ['基本情報', 'AI提案・調整', '確認・保存']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = i + 1
        const done = step > n
        const cur = step === n
        return (
          <div key={n} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              cur ? 'bg-[#2B3A4E] text-white' : done ? 'bg-[#B8860B] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                cur ? 'bg-white text-[#2B3A4E]' : done ? 'bg-white text-[#B8860B]' : 'bg-gray-300 text-gray-500'
              }`}>{done ? '✓' : n}</span>
              {label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${step > n ? 'bg-[#B8860B]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---- main component ----
export default function EstimateNewPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [items, setItems] = useState<EstimateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [discount, setDiscount] = useState(0)

  // ---- Step 1 handlers ----
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const onStep1Next = async () => {
    if (!form.deceased_name || !form.chief_mourner_name) {
      setError('故人氏名・喪主氏名は必須です')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/estimate/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ceremony_type: form.ceremony_type,
          expected_attendees: parseInt(form.expected_attendees) || 30,
          sect: form.sect,
          budget_preference: form.budget_preference,
          products: SEED_PRODUCTS,
        }),
      })
      const data = await res.json() as { items?: EstimateItem[]; error?: string }
      setItems(data.items ?? getFallbackItems(form))
    } catch {
      setItems(getFallbackItems(form))
    } finally {
      setLoading(false)
      setStep(2)
    }
  }

  // ---- Step 2 handlers ----
  const updateItem = (idx: number, field: keyof EstimateItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'product_name') {
        const p = SEED_PRODUCTS.find(p => p.name === value)
        if (p) {
          updated.unit_price = p.price
          updated.tax_type = p.tax_type
          updated.category = p.category
          updated.amount = p.price * updated.quantity
        }
      }
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : updated.quantity
        const price = field === 'unit_price' ? Number(value) : updated.unit_price
        updated.amount = qty * price
      }
      return updated
    }))
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const addItem = () => {
    const first = SEED_PRODUCTS[0]
    setItems(prev => [...prev, {
      category: first.category,
      product_name: first.name,
      quantity: 1,
      unit_price: first.price,
      tax_type: first.tax_type,
      amount: first.price,
    }])
  }

  // ---- Step 3 / save ----
  const { subtotal, tax, total } = calcTotals(items)
  const finalTotal = total - discount

  const onSave = () => {
    const caseId = uuidv4()
    const estimateId = uuidv4()
    const now = new Date().toISOString()
    addCase({
      id: caseId,
      deceased_name: form.deceased_name,
      deceased_kana: form.deceased_kana,
      date_of_death: form.date_of_death || now.slice(0, 10),
      chief_mourner_name: form.chief_mourner_name,
      chief_mourner_phone: form.chief_mourner_phone,
      chief_mourner_address: form.chief_mourner_address,
      religion: form.religion,
      sect: form.sect,
      ceremony_type: form.ceremony_type,
      expected_attendees: parseInt(form.expected_attendees) || 0,
      venue_name: form.venue_name,
      wake_date: form.wake_date || null,
      funeral_date: form.funeral_date || null,
      cremation_date: form.cremation_date || null,
      status: '見積済',
      share_token: null,
      created_at: now,
    })
    addEstimate({
      id: estimateId,
      case_id: caseId,
      version: 1,
      items,
      subtotal,
      tax,
      total,
      discount,
      created_at: now,
    })
    router.push('/dashboard')
  }

  // ---- render ----
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2B3A4E]">見積もり作成</h1>
      </div>
      <StepIndicator step={step} />

      {/* STEP 1 */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-bold text-[#2B3A4E] mb-6">基本情報の入力</h2>
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-6">
            <Field label="故人氏名 *">
              <input value={form.deceased_name} onChange={set('deceased_name')} className="input" placeholder="山田 太郎" />
            </Field>
            <Field label="故人氏名（ふりがな）">
              <input value={form.deceased_kana} onChange={set('deceased_kana')} className="input" placeholder="やまだ たろう" />
            </Field>
            <Field label="喪主氏名 *">
              <input value={form.chief_mourner_name} onChange={set('chief_mourner_name')} className="input" placeholder="山田 花子" />
            </Field>
            <Field label="喪主電話番号">
              <input value={form.chief_mourner_phone} onChange={set('chief_mourner_phone')} className="input" placeholder="090-0000-0000" />
            </Field>
            <Field label="逝去日">
              <input type="date" value={form.date_of_death} onChange={set('date_of_death')} className="input" />
            </Field>
            <Field label="葬儀形式">
              <select value={form.ceremony_type} onChange={set('ceremony_type')} className="input">
                {(['一般葬', '家族葬', '一日葬', '直葬'] as CeremonyType[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="宗教">
              <select value={form.religion} onChange={set('religion')} className="input">
                {(['仏教', '神道', 'キリスト教', '無宗教'] as Religion[]).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="宗派">
              <input value={form.sect} onChange={set('sect')} className="input" placeholder="浄土真宗本願寺派" />
            </Field>
            <Field label="想定参列者数">
              <input type="number" min="1" value={form.expected_attendees} onChange={set('expected_attendees')} className="input" />
            </Field>
            <Field label="式場名">
              <input value={form.venue_name} onChange={set('venue_name')} className="input" placeholder="〇〇セレモニーホール" />
            </Field>
            <Field label="通夜日時">
              <input type="datetime-local" value={form.wake_date} onChange={set('wake_date')} className="input" />
            </Field>
            <Field label="告別式日時">
              <input type="datetime-local" value={form.funeral_date} onChange={set('funeral_date')} className="input" />
            </Field>
            <Field label="火葬日時">
              <input type="datetime-local" value={form.cremation_date} onChange={set('cremation_date')} className="input" />
            </Field>
            <Field label="予算感">
              <div className="flex gap-3 pt-1">
                {([
                  { v: 'economy',  l: '抑えたい' },
                  { v: 'standard', l: '標準的に' },
                  { v: 'premium',  l: 'しっかり' },
                ] as { v: BudgetPreference; l: string }[]).map(o => (
                  <label key={o.v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="budget"
                      value={o.v}
                      checked={form.budget_preference === o.v}
                      onChange={set('budget_preference')}
                      className="accent-[#B8860B]"
                    />
                    <span className="text-sm text-gray-700">{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={onStep1Next}
              disabled={loading}
              className="bg-[#2B3A4E] hover:bg-[#1E2A3A] text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI が提案を生成中...
                </>
              ) : 'AI提案を取得して次へ →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#2B3A4E]">AI提案・内容調整</h2>
            <span className="text-xs bg-[#B8860B]/10 text-[#B8860B] px-3 py-1 rounded-full font-medium">
              AIが {form.ceremony_type}・{form.expected_attendees}名・{form.budget_preference === 'economy' ? '費用重視' : form.budget_preference === 'premium' ? 'プレミアム' : 'スタンダード'} で提案
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 text-xs text-gray-400 font-medium w-20">カテゴリ</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400 font-medium">商品名</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400 font-medium w-20 text-right">数量</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400 font-medium w-28 text-right">単価（税抜）</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400 font-medium w-16">税区分</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400 font-medium w-28 text-right">金額（税抜）</th>
                  <th className="px-4 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, idx) => {
                  const catProducts = SEED_PRODUCTS.filter(p => p.category === item.category)
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2">
                        <select
                          value={item.category}
                          onChange={e => {
                            const cat = e.target.value as ProductCategory
                            const first = SEED_PRODUCTS.find(p => p.category === cat)
                            if (first) {
                              setItems(prev => prev.map((it, i) => i !== idx ? it : {
                                ...it, category: cat, product_name: first.name,
                                unit_price: first.price, tax_type: first.tax_type,
                                amount: first.price * it.quantity,
                              }))
                            }
                          }}
                          className="text-xs border-0 bg-transparent p-0 cursor-pointer text-gray-600 focus:outline-none"
                        >
                          {CATEGORY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLOR[item.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={item.product_name}
                          onChange={e => updateItem(idx, 'product_name', e.target.value)}
                          className="input text-sm py-1"
                        >
                          {catProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          <option value={item.product_name}>{item.product_name}</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                          className="input text-sm py-1 w-16 text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        {item.unit_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-gray-500">{item.tax_type}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-[#2B3A4E]">
                        {item.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button onClick={addItem} className="mt-3 text-sm text-[#B8860B] hover:text-[#8B6508] transition-colors">
            ＋ 項目を追加
          </button>

          {/* Totals */}
          <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>小計（税抜）</span><span>{yen(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>消費税</span><span>{yen(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#2B3A4E] text-base border-t border-gray-100 pt-2">
                <span>合計（税込）</span><span>{yen(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← 基本情報に戻る
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-[#2B3A4E] hover:bg-[#1E2A3A] text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              確認へ →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Basic info summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-[#2B3A4E] mb-5">基本情報の確認</h2>
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 text-sm">
              {[
                ['故人氏名', form.deceased_name + (form.deceased_kana ? `（${form.deceased_kana}）` : '')],
                ['喪主氏名', form.chief_mourner_name],
                ['逝去日', form.date_of_death],
                ['葬儀形式', form.ceremony_type],
                ['宗派', form.sect || form.religion],
                ['参列者数', form.expected_attendees + '名'],
                ['式場名', form.venue_name || '—'],
                ['通夜', form.wake_date ? new Date(form.wake_date).toLocaleString('ja-JP') : '—'],
                ['告別式', form.funeral_date ? new Date(form.funeral_date).toLocaleString('ja-JP') : '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                  <p className="font-medium text-[#2B3A4E]">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estimate summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-[#2B3A4E] mb-5">見積もり明細</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 text-xs text-gray-400">カテゴリ</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400">商品名</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400 text-right">数量</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400 text-right">単価（税抜）</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400">税区分</th>
                  <th className="px-4 py-2.5 text-xs text-gray-400 text-right">金額（税抜）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[item.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{item.product_name}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{item.unit_price.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{item.tax_type}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#2B3A4E]">{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Discount & Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>小計（税抜）</span><span>{yen(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>消費税</span><span>{yen(tax)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>割引額</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                    className="input text-sm py-1 w-28 text-right"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between font-bold text-[#2B3A4E] text-lg border-t border-gray-200 pt-2">
                  <span>お見積り合計</span><span>{yen(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← 明細調整に戻る
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="border border-[#2B3A4E] text-[#2B3A4E] hover:bg-[#2B3A4E] hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                印刷・PDF出力
              </button>
              <button
                onClick={onSave}
                className="bg-[#B8860B] hover:bg-[#8B6508] text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                保存して完了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- helper component ----
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
