import React from 'react'

export default function CopyLinkButton({ text }: { text: string }) {
  const [done, setDone] = React.useState(false)
  const onClick = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(()=>setDone(false), 1500) } catch {}
  }
  return <button onClick={onClick} className="rounded-2xl border p-2">{done ? 'Copied' : 'Copy link'}</button>
}