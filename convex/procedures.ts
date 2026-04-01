import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const attrsValidator = v.object({
  hasPension: v.boolean(),
  hasRealEstate: v.boolean(),
  hasLifeInsurance: v.boolean(),
  hasBankAccount: v.boolean(),
  hasVehicle: v.boolean(),
  hasBusinessOwner: v.boolean(),
  hasHealthInsurance: v.boolean(),
  hasMycardNumber: v.boolean(),
})

export const getByCase = query({
  args: { case_id: v.id('cases') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('procedures')
      .withIndex('by_case', q => q.eq('case_id', args.case_id))
      .first()
  },
})

export const upsert = mutation({
  args: {
    case_id: v.id('cases'),
    attrs: attrsValidator,
    done: v.record(v.string(), v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('procedures')
      .withIndex('by_case', q => q.eq('case_id', args.case_id))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { attrs: args.attrs, done: args.done })
    } else {
      await ctx.db.insert('procedures', args)
    }
  },
})
