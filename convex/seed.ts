import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const seedCases = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('cases').first()
    if (existing) return 'already seeded'

    const seeds = [
      {
        deceased_name: '山田 太郎', deceased_kana: 'やまだ たろう',
        date_of_death: '2026-03-25', chief_mourner_name: '山田 花子',
        chief_mourner_phone: '090-1234-5678', chief_mourner_address: '東京都新宿区西新宿1-1-1',
        religion: '仏教', sect: '浄土真宗本願寺派', ceremony_type: '家族葬',
        expected_attendees: 30, venue_name: 'セレモニーホール新宿',
        wake_date: '2026-03-27T18:00:00', funeral_date: '2026-03-28T10:00:00',
        cremation_date: '2026-03-28T14:00:00', status: '施行中',
        share_token: 'tok-abc123', created_at: '2026-03-25T10:00:00',
      },
      {
        deceased_name: '田中 義雄', deceased_kana: 'たなか よしお',
        date_of_death: '2026-03-20', chief_mourner_name: '田中 次郎',
        chief_mourner_phone: '080-9876-5432', chief_mourner_address: '東京都渋谷区渋谷2-2-2',
        religion: '仏教', sect: '曹洞宗', ceremony_type: '一般葬',
        expected_attendees: 80, venue_name: 'セレモニーホール渋谷',
        wake_date: '2026-03-22T18:00:00', funeral_date: '2026-03-23T10:00:00',
        cremation_date: '2026-03-23T14:00:00', status: '完了',
        share_token: 'tok-def456', created_at: '2026-03-20T14:00:00',
      },
      {
        deceased_name: '鈴木 幸子', deceased_kana: 'すずき さちこ',
        date_of_death: '2026-03-28', chief_mourner_name: '鈴木 健一',
        chief_mourner_phone: '070-5555-6666', chief_mourner_address: '東京都品川区東品川3-3-3',
        religion: '仏教', sect: '天台宗', ceremony_type: '直葬',
        expected_attendees: 5, venue_name: '',
        wake_date: null, funeral_date: null,
        cremation_date: '2026-03-29T10:00:00', status: '相談中',
        share_token: null, created_at: '2026-03-28T09:00:00',
      },
    ]

    for (const s of seeds) {
      await ctx.db.insert('cases', s)
    }
    return 'seeded'
  },
})
