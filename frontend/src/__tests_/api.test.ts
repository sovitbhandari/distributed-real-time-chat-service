import { describe, it, expect } from 'vitest'
import { shareLinkFor } from '../lib/api'

describe('api helpers', () => {
  it('builds a share link from current origin', () => {
    // jsdom sets a default origin; be explicit to ensure stability
    Object.defineProperty(window, 'location', { value: new URL('http://localhost:5173/'), writable: true })
    const url = shareLinkFor('general')
    expect(url).toBe('http://localhost:5173/room/general/')
  })
})