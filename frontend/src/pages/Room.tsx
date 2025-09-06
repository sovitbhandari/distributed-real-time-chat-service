// frontend/src/pages/Room.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'

type ChatMsg = { type: 'chat.message'; username: string; content: string; created_at: string }
type EventMsg =
  | { type: 'history'; items: ChatMsg[] }
  | ChatMsg
  | { type: 'system'; event: 'join' | 'leave'; username: string; ts: string }
  | { type: 'presence'; members: string[]; ts: string }

export default function Room() {
  const match = window.location.pathname.match(/^\/room\/([^/]+)\/?$/)
  const roomName = match?.[1] ?? ''

  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [members, setMembers] = useState<string[]>([])
  const [text, setText] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // In dev, Vite proxies /ws to Daphne (127.0.0.1:8000)
  const wsUrl = useMemo(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${location.host}/ws/chat/${roomName}/` // trailing slash!
  }, [roomName])

  useEffect(() => {
    if (!roomName) return

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    const onDown = () => setConnected(false)

    ws.onopen = () => setConnected(true)
    ws.onclose = onDown
    ws.onerror = onDown

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as EventMsg

      if (msg.type === 'history') {
        setMessages(msg.items)
      } else if (msg.type === 'chat.message') {
        setMessages((prev) => [...prev, msg])
      } else if (msg.type === 'presence') {
        setMembers(msg.members)
      } else if (msg.type === 'system') {
        const phrase = msg.event === 'join' ? 'joined the room' : 'left the room'
        setMessages((prev) => [
          ...prev,
          { type: 'chat.message', username: 'system', content: `${msg.username} ${phrase}`, created_at: msg.ts }
        ])
      }

      queueMicrotask(() => listRef.current?.scrollTo({ top: 9e9 }))
    }

    return () => ws.close()
  }, [wsUrl]) // wsUrl already depends on roomName

  const send = () => {
    const v = text.trim()
    if (!v || wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'chat.message', content: v }))
    setText('')
  }

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px', color: '#e7ebf3', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Room: {roomName}</h2>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '6px 10px',
            borderRadius: 8,
            background: '#e24038ff',
            color: '#0b1222',
            fontWeight: 700,
            border: '1px solid #16a34a'
          }}
        >
          Leave
        </a>
      </div>

      <div style={{ opacity: 0.7, marginBottom: 8 }}>
        {connected ? 'Connected' : 'Disconnected'}
        {members.length ? ` • ${members.length} online: ${members.join(', ')}` : null}
      </div>

      <div
        ref={listRef}
        style={{ height: '60vh', overflowY: 'auto', background: '#5f757fff', borderRadius: 12, padding: 12, border: '1px solid #27314a' }}
      >
        {messages.length === 0 && <div style={{ opacity: 0.6 }}>No messages yet</div>}
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: '8px 0', padding: '8px 10px', background: '#4c4d4eff', borderRadius: 10, border: '1px solid #27314a' }}>
            <strong>{msg.username}</strong>: {msg.content}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #283148',
            background: '#f3f3f9ff',
            color: '#060607ff'
          }}
        />
        <button onClick={send} style={{ padding: '10px 14px', borderRadius: 10, background: '#1f6feb', color: '#fff', border: 'none' }}>
          Send
        </button>
      </div>
    </div>
  )
}
