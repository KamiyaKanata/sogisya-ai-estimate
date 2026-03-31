import type { Product, Case, Estimate, EstimateItem } from './types'

export const SEED_PRODUCTS: Product[] = [
  { id: 'p1',  category: '祭壇', name: '花祭壇 S',       description: '小規模向け花祭壇',    price: 200000, tax_type: '課税10%', is_per_person: false, sort_order: 1 },
  { id: 'p2',  category: '祭壇', name: '花祭壇 M',       description: '標準的な花祭壇',      price: 350000, tax_type: '課税10%', is_per_person: false, sort_order: 2 },
  { id: 'p3',  category: '祭壇', name: '花祭壇 L',       description: '大規模葬儀向け花祭壇', price: 500000, tax_type: '課税10%', is_per_person: false, sort_order: 3 },
  { id: 'p4',  category: '祭壇', name: '白木祭壇 標準',   description: '伝統的な白木祭壇',    price: 300000, tax_type: '課税10%', is_per_person: false, sort_order: 4 },
  { id: 'p5',  category: '棺',   name: '布張棺（標準）',  description: '標準的な布張棺',      price: 80000,  tax_type: '課税10%', is_per_person: false, sort_order: 5 },
  { id: 'p6',  category: '棺',   name: '桐棺',           description: '上質な桐材の棺',      price: 150000, tax_type: '課税10%', is_per_person: false, sort_order: 6 },
  { id: 'p7',  category: '棺',   name: '彫刻棺',         description: '精巧な彫刻が施された棺', price: 300000, tax_type: '課税10%', is_per_person: false, sort_order: 7 },
  { id: 'p8',  category: '骨壺', name: '白磁 7寸',       description: '白磁の骨壺',          price: 8000,   tax_type: '課税10%', is_per_person: false, sort_order: 8 },
  { id: 'p9',  category: '骨壺', name: '大理石調 7寸',   description: '大理石調の骨壺',      price: 20000,  tax_type: '課税10%', is_per_person: false, sort_order: 9 },
  { id: 'p10', category: '運営', name: '式場使用料（1日）', description: '式場の1日使用料',  price: 100000, tax_type: '課税10%', is_per_person: false, sort_order: 10 },
  { id: 'p11', category: '運営', name: 'ドライアイス（1日）', description: '1日分のドライアイス', price: 8000, tax_type: '課税10%', is_per_person: false, sort_order: 11 },
  { id: 'p12', category: '運営', name: '安置料（1日）',   description: '1日の安置料',         price: 10000,  tax_type: '課税10%', is_per_person: false, sort_order: 12 },
  { id: 'p13', category: '運営', name: '運搬費（基本）',  description: '基本運搬費',          price: 20000,  tax_type: '課税10%', is_per_person: false, sort_order: 13 },
  { id: 'p14', category: '運営', name: '遺影写真加工',    description: '遺影写真の加工',      price: 20000,  tax_type: '課税10%', is_per_person: false, sort_order: 14 },
  { id: 'p15', category: '運営', name: '火葬料（市民）',  description: '市民向け火葬料',      price: 0,      tax_type: '非課税',  is_per_person: false, sort_order: 15 },
  { id: 'p16', category: '運営', name: '火葬料（市外）',  description: '市外向け火葬料',      price: 60000,  tax_type: '非課税',  is_per_person: false, sort_order: 16 },
  { id: 'p17', category: '料理', name: '通夜振る舞い（一人）', description: '通夜の振る舞い料理（一人分）', price: 3000, tax_type: '課税8%', is_per_person: true, sort_order: 17 },
  { id: 'p18', category: '料理', name: '精進落とし（一人）',   description: '精進落としの料理（一人分）', price: 5000, tax_type: '課税8%', is_per_person: true, sort_order: 18 },
  { id: 'p19', category: '返礼品', name: '会葬御礼品',    description: '会葬への返礼品',      price: 1000,   tax_type: '課税10%', is_per_person: true, sort_order: 19 },
  { id: 'p20', category: '返礼品', name: '即日香典返し',  description: '即日の香典返し品',    price: 2500,   tax_type: '課税10%', is_per_person: true, sort_order: 20 },
  { id: 'p21', category: '車両', name: '洋型霊柩車',     description: '洋型霊柩車',          price: 50000,  tax_type: '課税10%', is_per_person: false, sort_order: 21 },
  { id: 'p22', category: '車両', name: 'マイクロバス',   description: 'マイクロバス',        price: 40000,  tax_type: '課税10%', is_per_person: false, sort_order: 22 },
]

const CASES_KEY = 'sogisya_cases'
const ESTIMATES_KEY = 'sogisya_estimates'

function getInitialCases(): Case[] {
  return [
    {
      id: 'case-1',
      deceased_name: '山田 太郎',
      deceased_kana: 'やまだ たろう',
      date_of_death: '2026-03-25',
      chief_mourner_name: '山田 花子',
      chief_mourner_phone: '090-1234-5678',
      chief_mourner_address: '東京都新宿区西新宿1-1-1',
      religion: '仏教',
      sect: '浄土真宗本願寺派',
      ceremony_type: '家族葬',
      expected_attendees: 30,
      venue_name: 'セレモニーホール新宿',
      wake_date: '2026-03-27T18:00:00',
      funeral_date: '2026-03-28T10:00:00',
      cremation_date: '2026-03-28T14:00:00',
      status: '施行中',
      share_token: 'tok-abc123',
      created_at: '2026-03-25T10:00:00',
    },
    {
      id: 'case-2',
      deceased_name: '田中 義雄',
      deceased_kana: 'たなか よしお',
      date_of_death: '2026-03-20',
      chief_mourner_name: '田中 次郎',
      chief_mourner_phone: '080-9876-5432',
      chief_mourner_address: '東京都渋谷区渋谷2-2-2',
      religion: '仏教',
      sect: '曹洞宗',
      ceremony_type: '一般葬',
      expected_attendees: 80,
      venue_name: 'セレモニーホール渋谷',
      wake_date: '2026-03-22T18:00:00',
      funeral_date: '2026-03-23T10:00:00',
      cremation_date: '2026-03-23T14:00:00',
      status: '完了',
      share_token: 'tok-def456',
      created_at: '2026-03-20T14:00:00',
    },
    {
      id: 'case-3',
      deceased_name: '鈴木 幸子',
      deceased_kana: 'すずき さちこ',
      date_of_death: '2026-03-28',
      chief_mourner_name: '鈴木 健一',
      chief_mourner_phone: '070-5555-6666',
      chief_mourner_address: '東京都品川区東品川3-3-3',
      religion: '仏教',
      sect: '天台宗',
      ceremony_type: '直葬',
      expected_attendees: 5,
      venue_name: '',
      wake_date: null,
      funeral_date: null,
      cremation_date: '2026-03-29T10:00:00',
      status: '相談中',
      share_token: null,
      created_at: '2026-03-28T09:00:00',
    },
    {
      id: 'case-4',
      deceased_name: '佐藤 誠',
      deceased_kana: 'さとう まこと',
      date_of_death: '2026-03-15',
      chief_mourner_name: '佐藤 美咲',
      chief_mourner_phone: '090-3333-4444',
      chief_mourner_address: '東京都港区赤坂4-4-4',
      religion: '無宗教',
      sect: '',
      ceremony_type: '一日葬',
      expected_attendees: 20,
      venue_name: 'セレモニーホール港',
      wake_date: null,
      funeral_date: '2026-03-17T10:00:00',
      cremation_date: '2026-03-17T14:00:00',
      status: '精算済',
      share_token: 'tok-ghi789',
      created_at: '2026-03-15T11:00:00',
    },
  ]
}

export function getCases(): Case[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(CASES_KEY)
    if (data) return JSON.parse(data) as Case[]
    const initial = getInitialCases()
    localStorage.setItem(CASES_KEY, JSON.stringify(initial))
    return initial
  } catch {
    return getInitialCases()
  }
}

export function saveCases(cases: Case[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CASES_KEY, JSON.stringify(cases))
}

export function addCase(newCase: Case): void {
  const cases = getCases()
  saveCases([newCase, ...cases])
}

export function getEstimates(): Estimate[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(ESTIMATES_KEY)
    return data ? (JSON.parse(data) as Estimate[]) : []
  } catch {
    return []
  }
}

export function saveEstimates(estimates: Estimate[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ESTIMATES_KEY, JSON.stringify(estimates))
}

export function addEstimate(estimate: Estimate): void {
  const estimates = getEstimates()
  saveEstimates([...estimates, estimate])
}

export function getEstimatesByCaseId(caseId: string): Estimate[] {
  return getEstimates().filter(e => e.case_id === caseId)
}

export function calcTotals(items: EstimateItem[]): { subtotal: number; tax: number; total: number } {
  let subtotal = 0
  let tax = 0
  for (const item of items) {
    subtotal += item.amount
    if (item.tax_type === '課税10%') tax += Math.floor(item.amount * 0.1)
    else if (item.tax_type === '課税8%') tax += Math.floor(item.amount * 0.08)
  }
  return { subtotal, tax, total: subtotal + tax }
}
