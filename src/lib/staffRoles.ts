export const STAFF_ROLES=['support_agent','dispute_officer','finance_operator','risk_officer','admin','super_admin'] as const
export type StaffRole=typeof STAFF_ROLES[number]
export const isStaffRole=(value:unknown):value is StaffRole=>typeof value==='string'&&(STAFF_ROLES as readonly string[]).includes(value)
export const STAFF_CAPABILITIES={
  support_agent:['cases:read','cases:communicate'],
  dispute_officer:['cases:read','disputes:decide'],
  finance_operator:['finance:read','refunds:execute','payouts:execute'],
  risk_officer:['risk:read','compliance:review'],
  admin:['cases:read','cases:communicate','disputes:decide','finance:read','risk:read','compliance:review'],
  super_admin:['*']
} satisfies Record<StaffRole,string[]>

export const OWNER_EMAIL=(process.env.SUPER_ADMIN_EMAIL||'babatundeoralusi@gmail.com').trim().toLowerCase()
export function hasCapability(role:StaffRole,capability:string){const values=STAFF_CAPABILITIES[role] as readonly string[];return values.includes('*')||values.includes(capability)}
