import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  cases: defineTable({
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
  }).index('by_status', ['status']),

  estimates: defineTable({
    case_id: v.id('cases'),
    version: v.number(),
    items: v.array(v.object({
      category: v.string(),
      product_name: v.string(),
      quantity: v.number(),
      unit_price: v.number(),
      tax_type: v.string(),
      amount: v.number(),
    })),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    discount: v.number(),
    created_at: v.string(),
  }).index('by_case', ['case_id']),

  kouden: defineTable({
    case_id: v.id('cases'),
    name: v.string(),
    kana: v.string(),
    amount: v.number(),
    relation: v.string(),
    address: v.string(),
    note: v.string(),
    returned: v.boolean(),
    return_amount: v.number(),
  }).index('by_case', ['case_id']),

  procedures: defineTable({
    case_id: v.id('cases'),
    attrs: v.object({
      hasPension: v.boolean(),
      hasRealEstate: v.boolean(),
      hasLifeInsurance: v.boolean(),
      hasBankAccount: v.boolean(),
      hasVehicle: v.boolean(),
      hasBusinessOwner: v.boolean(),
      hasHealthInsurance: v.boolean(),
      hasMycardNumber: v.boolean(),
    }),
    done: v.record(v.string(), v.boolean()),
  }).index('by_case', ['case_id']),
})
