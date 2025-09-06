import React, { useEffect } from 'react'
import CreateRoomForm from '../components/CreateRoomForm'
import JoinRoomForm from '../components/JoinRoomForm'

export default function Home() {
  useEffect(() => {
    fetch('/api/csrf', { credentials: 'same-origin' }).catch(() => {})
  }, [])

  return (
    <div className="container">
      <div className="card">
        <h2>Distributed Real-Time Chat Service</h2>
        <p className="opacity-70">Create a room with a password, share the link, and chat in real time.</p>
      </div>
      <CreateRoomForm />
      <JoinRoomForm />
    </div>
  )
}
