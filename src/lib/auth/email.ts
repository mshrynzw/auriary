/**
 * 保存前のメールアドレス。D1 の m_users.email は小文字・前後空白なしだけを許す。
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
