import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const itemValidator = v.object({
  category: v.string(),
  product_name: v.string(),
  quantity: v.number(),
  unit_price: v.number(),
  tax_type: v.string(),
  amount: v.number(),
})

export const listByCase = query({
  args: { case_id: v.id('cases') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('estimates')
      .withIndex('by_case', q => q.eq('case_id', args.case_id))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    case_id: v.id('cases'),
    version: v.number(),
    items: v.array(itemValidator),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    discount: v.number(),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('estimates', args)
  },
})
