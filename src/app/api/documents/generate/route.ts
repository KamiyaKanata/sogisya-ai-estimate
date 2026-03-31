import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Case } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPTS: Record<string, (c: Case) => string> = {
  obituary: (c) => `以下の情報をもとに、日本の葬儀で使用する「訃報文」を作成してください。
- 故人名：${c.deceased_name}
- 喪主名：${c.chief_mourner_name}
- 逝去日：${c.date_of_death}
- 葬儀形式：${c.ceremony_type}
- 式場：${c.venue_name || '〇〇式場'}
- 告別式日時：${c.funeral_date || '●月●日'}
- 宗派：${c.sect || c.religion}

丁寧で正式な日本語で、A4用紙1枚程度の訃報文を作成してください。テキストのみで出力してください。`,

  condolence: (c) => `以下の情報をもとに、会葬者へお送りする「会葬御礼状」を作成してください。
- 故人名：${c.deceased_name}
- 喪主名：${c.chief_mourner_name}
- 宗派：${c.sect || c.religion}

葬儀に参列いただいた方へのお礼の気持ちが伝わる、丁寧で心のこもった文章を作成してください。テキストのみで出力してください。`,

  ceremony: (c) => `以下の情報をもとに「式次第（告別式のプログラム）」を作成してください。
- 葬儀形式：${c.ceremony_type}
- 宗教・宗派：${c.religion} ${c.sect || ''}
- 喪主：${c.chief_mourner_name}

一般的な${c.ceremony_type}の進行に沿った式次第を、箇条書き形式で作成してください。テキストのみで出力してください。`,
}

export async function POST(request: NextRequest) {
  try {
    const { type, caseData } = await request.json() as { type: string; caseData: Case }
    const promptFn = PROMPTS[type]
    if (!promptFn) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: promptFn(caseData) }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Document generate error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
