import { describe, expect, it } from 'vitest'
import { createLock, validatePin, verifyPin } from '../lock.js'

describe('validatePin', () => {
  it('accepts 4 to 8 digits', () => {
    expect(validatePin('1234')).toBeNull()
    expect(validatePin('12345678')).toBeNull()
  })

  it('rejects too short, too long, and non-digits', () => {
    expect(validatePin('123')).toMatch(/4 tot 8/)
    expect(validatePin('123456789')).toMatch(/4 tot 8/)
    expect(validatePin('12a4')).toMatch(/4 tot 8/)
    expect(validatePin('')).toMatch(/4 tot 8/)
  })

  it('rejects a PIN that is all the same digit', () => {
    expect(validatePin('1111')).toMatch(/hetzelfde/)
    expect(validatePin('0000')).toMatch(/hetzelfde/)
  })
})

describe('createLock / verifyPin', () => {
  it('accepts the right PIN and rejects a wrong one', async () => {
    const lock = await createLock('4821')
    expect(await verifyPin('4821', lock)).toBe(true)
    expect(await verifyPin('4822', lock)).toBe(false)
  })

  it('never stores the PIN itself', async () => {
    const lock = await createLock('4821')
    expect(JSON.stringify(lock)).not.toContain('4821')
  })

  it('gives two identical PINs different hashes, via a random salt', async () => {
    const a = await createLock('4821')
    const b = await createLock('4821')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
    // ...but each still verifies against its own record.
    expect(await verifyPin('4821', a)).toBe(true)
    expect(await verifyPin('4821', b)).toBe(true)
  })

  it('refuses gracefully when the lock record is missing or broken', async () => {
    expect(await verifyPin('4821', null)).toBe(false)
    expect(await verifyPin('4821', {})).toBe(false)
    expect(await verifyPin('4821', { salt: 'x' })).toBe(false)
  })
})
