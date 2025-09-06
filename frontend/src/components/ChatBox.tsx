import React from 'react'
import type { ChatMessage } from '../types/chat'
import { connectWS } from '../lib/ws'
import { getUsername } from '../lib/storage'

export default function ChatBox({ roomId }: { roomId: string }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [text, setText] = React.useState('')
  const [status, setStatus] = React.useState<'connecting'|'open'|'closed'>('connecting')
  const boxRef = React.useRef<HTMLDivElement | null>(null)
  const wsRef = React.useRef<WebSocket | null>(null)
  const username = React.useMemo(() => getUsername(), [])

  React.useEffect(() => {
    const ws = connectWS(roomId)
    wsRef.current = ws
    ws.onopen = () => setStatus('open')
    ws.onmessage = (e) => {
      try { setMessages((m)=>[...m, JSON.parse(e.data)]) } catch {}
      queueMicrotask(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight })
    }
    ws.onclose = () => setStatus('closed')
    return () => { wsRef.current = null; ws.close() }
  }, [roomId])

  function send(e: React.FormEvent) {
    e.preventDefault()
    const m = text.trim()
    if (!m) return
    const ws = wsRef.current
    if (!ws) { setStatus('connecting'); return }
    const payload = JSON.stringify({ username, message: m })
    if (ws.readyState === ws.OPEN) {
      ws.send(payload)
    } else {
      const once = () => ws.send(payload)
      ws.addEventListener('open', once, { once: true })
    }
    setText('')
  }

  return (
    <div>
      <div className="flex" style={{justifyContent:'space-between', alignItems:'baseline'}}>
        <div>
          <div className="text-xl">Room: <code>{roomId}</code></div>
          <div className="opacity-70">You are <strong>{username}</strong> {status !== 'open' && <em>({status})</em>}</div>
        </div>
        <a className="underline" href="/">Home</a>
      </div>

      <div ref={boxRef} className="border rounded-2xl p-3 mt-3 h-60vh overflow-auto">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.username === username ? 'you' : ''}`}>
            {m.username === 'system' ? <em>{m.message}</em> : (<><strong>{m.username}</strong>: {m.message}</>)}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 mt-3">
        <input className="w-full rounded-xl" placeholder="Type a message..." value={text} onChange={e=>setText(e.target.value)} />
        <button>Send</button>
      </form>
    </div>
  )
}