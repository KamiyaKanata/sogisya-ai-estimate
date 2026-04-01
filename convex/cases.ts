import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('cases').order('desc').collect()
  },
})

export const get = query({
  args: { id: v.id('cases') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    deceased_name: v.string(),
    deceased_kana: v.string(),
    date_of_death: v.string(),
    chief_mourner_name: v.string(),
    chief_mourner_phone: v.string(),
    chief_mourner_address: v.string(),
    religion: v.string(),
    sect: v.string(),
    ceremony_type: v.string(),
    expected_attendees: v.number(),
    venue_name: v.string(),
    wake_date: v.union(v.string(), v.null()),
    funeral_date: v.union(v.string(), v.null()),
    cremation_date: v.union(v.string(), v.null()),
    status: v.string(),
    share_token: v.union(v.string(), v.null()),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('cases', args)
  },
})

export const updateStatus = mutation({
  args: { id: v.id('cases'), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status })
  },
})

export const update = mutation({
  args: {
    id: v.id('cases'),
    deceased_name: v.optional(v.string()),
    deceased_kana: v.optional(v.string()),
    date_of_death: v.optional(v.string()),
    chief_mourner_name: v.optional(v.string()),
    chief_mourner_phone: v.optional(v.string()),
    chief_mourner_address: v.optional(v.string()),
    religion: v.optional(v.string()),
    sect: v.optional(v.string()),
    ceremony_type: v.optional(v.string()),
    expected_attendees: v.optional(v.number()),
    venue_name: v.optional(v.string()),
    wake_date: v.optional(v.union(v.string(), v.null())),
    funeral_date: v.optional(v.union(v.string(), v.null())),
    cremation_date: v.optional(v.union(v.string(), v.null())),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields)
  },
})
