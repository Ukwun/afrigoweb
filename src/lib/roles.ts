export const ALLOWED_ROLES = ['Buyer', 'Seller', 'Exporter'] as const

export type Role = (typeof ALLOWED_ROLES)[number]

export function isValidRole(role: unknown): role is Role {
  return typeof role === 'string' && (ALLOWED_ROLES as readonly string[]).includes(role)
}

export function normalizeRole(role: unknown): Role | null {
  if (!role || typeof role !== 'string') return null
  const r = role.trim()
  return isValidRole(r) ? (r as Role) : null
}
