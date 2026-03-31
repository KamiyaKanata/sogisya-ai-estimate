export type CeremonyType = '一般葬' | '家族葬' | '一日葬' | '直葬'
export type Status = '相談中' | '見積済' | '施行中' | '完了' | '精算済'
export type Religion = '仏教' | '神道' | 'キリスト教' | '無宗教'
export type TaxType = '課税10%' | '課税8%' | '非課税'
export type ProductCategory = '祭壇' | '棺' | '骨壺' | '運営' | '料理' | '返礼品' | '車両' | 'その他'
export type BudgetPreference = 'economy' | 'standard' | 'premium'

export interface Case {
  id: string
  deceased_name: string
  deceased_kana: string
  date_of_death: string
  chief_mourner_name: string
  chief_mourner_phone: string
  chief_mourner_address: string
  religion: Religion
  sect: string
  ceremony_type: CeremonyType
  expected_attendees: number
  venue_name: string
  wake_date: string | null
  funeral_date: string | null
  cremation_date: string | null
  status: Status
  share_token: string | null
  created_at: string
}

export interface EstimateItem {
  category: ProductCategory
  product_name: string
  quantity: number
  unit_price: number
  tax_type: TaxType
  amount: number
}

export interface Estimate {
  id: string
  case_id: string
  version: number
  items: EstimateItem[]
  subtotal: number
  tax: number
  total: number
  discount: number
  created_at: string
}

export interface Product {
  id: string
  category: ProductCategory
  name: string
  description: string
  price: number
  tax_type: TaxType
  is_per_person: boolean
  sort_order: number
}
