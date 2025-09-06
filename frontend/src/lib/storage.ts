const USER_KEY = 'djchat_username'

export function getUsername(): string {
  const u = localStorage.getItem(USER_KEY)
  if (u) return u.slice(0, 50)
  const g = `user${Math.floor(1000 + Math.random() * 9000)}`
  localStorage.setItem(USER_KEY, g)
  return g
}

export function setUsername(u: string) {
  localStorage.setItem(USER_KEY, u.slice(0, 50))
}