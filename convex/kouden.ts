import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const listByCase = query({
  args: { case_id: v.id('cases') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('kouden')
      .withIndex('by_case', q => q.eq('case_id', args.case_id))
      .collect()
  },
})

export const create = mutation({
  args: {
    case_id: v.id('cases'),
    name: v.string(),
    kana: v.string(),
    amount: v.number(),
    relation: v.string(),
    address: v.string(),
    note: v.string(),
    returned: v.boolean(),
    return_amount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('kouden', args)
  },
})

export const update = mutation({
  args: {
    id: v.id('kouden'),
    name: v.optional(v.string()),
    kana: v.optional(v.string()),
    amount: v.optional(v.number()),
    relation: v.optional(v.string()),
    address: v.optional(v.string()),
    note: v.optional(v.string()),
    returned: v.optional(v.boolean()),
    return_amount: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields)
  },
})

export const remove = mutation({
  args: { id: v.id('kouden') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
