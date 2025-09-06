export function connectWS(roomId: string): WebSocket {
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return new WebSocket(`${scheme}://${window.location.host}/ws/chat/${encodeURIComponent(roomId)}/`)
}