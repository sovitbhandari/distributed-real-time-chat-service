import React from 'react'
import { postJSON, shareLinkFor } from '../lib/api'
import CopyLinkButton from './CopyLinkButton'

type CreateResp = { ok: boolean; id: string; link: string }

export default function CreateRoomForm() {
  const [roomId, setRoomId] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [share, setShare] = React.useState<string | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setShare(null)
    if (!roomId || !password) { setErr('Room ID and password required'); return }
    setLoading(true)
    try {
      const out = await postJSON<CreateResp>('/api/rooms', { id: roomId, password })
      setShare(shareLinkFor(out.id))
    } catch (e:any) {
      setErr(/409|exists/i.test(String(e)) ? 'Room already exists' : String(e))
    } finally { setLoading(false) }
  }

  return (
    <div className="card mt-4">
      <h3 className="text-xl">Create a room</h3>
      <form onSubmit={onSubmit} className="mt-2">
        <div className="flex gap-2">
          <input className="w-full" placeholder="room id (e.g., general)" value={roomId} onChange={e=>setRoomId(e.target.value)} />
          <input className="w-full" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button disabled={loading}>{loading ? 'Creating…' : 'Create'}</button>
        </div>
      </form>
      {err && <div className="mt-2" style={{color:'#ffb3b3'}}>{err}</div>}
      {share && (
        <div className="mt-2 flex gap-3">
          <code className="p-2 border rounded-xl">{share}</code>
          <CopyLinkButton text={share} />
        </div>
      )}
    </div>
  )
}