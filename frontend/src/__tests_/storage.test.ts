import { describe, it, expect, beforeEach } from 'vitest'
import { getUsername, setUsername } from '../lib/storage'

// simple in-memory shim for localStorage
class MemStore { store = new Map<string,string>();
  getItem(k:string){ return this.store.has(k) ? this.store.get(k)! : null }
  setItem(k:string,v:string){ this.store.set(k,v) }
  removeItem(k:string){ this.store.delete(k) }
  clear(){ this.store.clear() }
}

const mem = new MemStore() as any

// @ts-ignore
globalThis.localStorage = mem

describe('storage', () => {
  beforeEach(() => mem.clear())

  it('generates a username when missing', () => {
    const u = getUsername()
    expect(u).toMatch(/^user\d{4}$/)
  })

  it('respects previously set username and trims to 50 chars', () => {
    const long = 'x'.repeat(80)
    setUsername(long)
    const u = getUsername()
    expect(u.length).toBe(50)
  })
})