import React from 'react'
import { postJSON } from '../lib/api'
import { getUsername, setUsername } from '../lib/storage'

type JoinResp = { ok: boolean }

export default function JoinRoomForm() {
  const [roomId, setRoomId] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [username, setU] = React.useState(getUsername())
  const [err, setErr] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!roomId || !password || !username) { setErr('room, password, and username required'); return }
    setLoading(true)
    try {
      await postJSON<JoinResp>(`/api/rooms/${encodeURIComponent(roomId)}/join`, { password, username })
      setUsername(username)
      window.location.href = `/room/${encodeURIComponent(roomId)}/`
    } catch (e:any) {
      setErr(/403|Forbidden|password/i.test(String(e)) ? 'Wrong password' : String(e))
    } finally { setLoading(false) }
  }

  return (
    <div className="card mt-4">
      <h3 className="text-xl">Join a room</h3>
      <form onSubmit={onSubmit} className="mt-2">
        <div className="flex gap-2">
          <input className="w-full" placeholder="room id" value={roomId} onChange={e=>setRoomId(e.target.value)} />
          <input className="w-full" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="w-full" placeholder="choose a username" value={username} onChange={e=>setU(e.target.value)} />
          <button disabled={loading}>{loading ? 'Joining…' : 'Join'}</button>
        </div>
      </form>
      {err && <div className="mt-2" style={{color:'#ffb3b3'}}>{err}</div>}
    </div>
  )
}