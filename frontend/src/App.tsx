import React from 'react'
import Home from './pages/Home'
import Room from './pages/Room'
import './styles/index.css'

export default function App() {
  const isRoom = /^\/room\/[^/]+\/?$/.test(window.location.pathname)
  return isRoom ? <Room /> : <Home />
}
