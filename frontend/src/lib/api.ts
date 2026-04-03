// frontend/src/lib/api.ts
export function getCookie(name: string) {
  let cookieValue: string | null = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

async function ensureCSRFToken() {
  let token = getCookie('csrftoken') || ''
  if (token) return token

  // Prime CSRF cookie before first mutating request.
  await fetch('/api/csrf', { credentials: 'same-origin' })
  token = getCookie('csrftoken') || ''
  return token
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const csrftoken = await ensureCSRFToken()
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json() as Promise<T>
}

export function shareLinkFor(roomId: string) {
  const url = new URL(`/room/${encodeURIComponent(roomId)}`, window.location.origin)
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url.toString()
}