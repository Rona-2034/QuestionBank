import type { AuthUser } from './types';

export function isAdmin(user: AuthUser | null): boolean {
  return user?.authorities?.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN')
    ?? Boolean(user?.rolesName?.includes('管理员'));
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return Boolean(user?.authorities?.includes('ROLE_SUPER_ADMIN'));
}
