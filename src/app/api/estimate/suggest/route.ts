import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Product, EstimateItem, BudgetPreference } from '@/lib/types'

interface SuggestRequest {
  ceremony_type: string
  expected_attendees: number
  sect: string
  budget_preference: BudgetPreference
  products: Product[]
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SuggestRequest
    const { ceremony_type, expected_attendees, sect, budget_preference, products } = body

    const budgetLabel = {
      economy:  'できるだけ費用を抑えたい（エコノミー）',
      standard: '標準的な価格帯（スタンダード）',
      premium:  'しっかりとした葬儀を行いたい（プレミアム）',
    }[budget_preference]

    const productList = products.map(p =>
      `${p.category}: "${p.name}" 単価${p.price.toLocaleString()}円 ${p.tax_type}${p.is_per_person ? ' [人数課金]' : ''}`
    ).join('\n')

    const prompt = `あなたは葬儀の見積もり専門家です。以下の条件に最適な商品構成をJSONで返してください。

【条件】
葬儀形式: ${ceremony_type}
参列者数: ${expected_attendees}名
宗派: ${sect || '未指定'}
予算: ${budgetLabel}

【商品リスト】
${productList}

【選択ルール】
- 直葬: 棺・骨壺・運搬費・ドライアイス・安置料・火葬料のみ。式場・料理・返礼品は不要
- 家族葬/一日葬: 式場1日、通夜振る舞いは家族葬のみ
- 一般葬: 式場2日、通夜振る舞いあり
- ドライアイスと安置料は直葬2日、それ以外3日
- 料理・返礼品は参列者数分
- エコノミー→最低グレード、プレミアム→最上位グレード
- 宗派不問なら花祭壇、浄土真宗なら白木祭壇を避ける

JSONのみを返してください（説明文不要）：
[{"category":"...","product_name":"...","quantity":数値,"unit_price":数値,"tax_type":"...","amount":数値}]`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('AI response parse failed')

    const items = JSON.parse(match[0]) as EstimateItem[]
    return NextResponse.json({ items })
  } catch (error) {
    console.error('AI suggest error:', error)
    return NextResponse.json({ error: 'AI提案の生成に失敗しました' }, { status: 500 })
  }
}
