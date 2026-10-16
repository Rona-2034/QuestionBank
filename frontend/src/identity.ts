export function displayAccount(username?: string | null): string {
  return username?.split('@')[0] || '未设置';
}
