import { describe, expect, it } from 'vitest'
import { formatValue, parseEstimate } from './format'

describe('parseEstimate', () => {
  it('reads plain and formatted numbers', () => {
    expect(parseEstimate('2450')).toBe(2450)
    expect(parseEstimate('$2,450')).toBe(2450)
    expect(parseEstimate('18.9%')).toBe(18.9)
    expect(parseEstimate('8x')).toBe(8)
    expect(parseEstimate('.5')).toBe(0.5)
  })

  it('reads magnitude suffixes', () => {
    expect(parseEstimate('23.76b')).toBeCloseTo(23.76e9)
    expect(parseEstimate('876M')).toBe(876e6)
    expect(parseEstimate('$1.2 million')).toBe(1.2e6)
    expect(parseEstimate('30mm')).toBe(30e6)
    expect(parseEstimate('960k')).toBe(960e3)
  })

  it('reads negatives, including a typographic minus', () => {
    expect(parseEstimate('-60')).toBe(-60)
    expect(parseEstimate('−4%')).toBe(-4)
  })

  it('rejects junk', () => {
    expect(parseEstimate('')).toBeNull()
    expect(parseEstimate('abc')).toBeNull()
    expect(parseEstimate('1.2.3')).toBeNull()
  })
})

describe('formatValue', () => {
  it('formats units', () => {
    expect(formatValue(1_650_000_000, '$')).toBe('$1.65B')
    expect(formatValue(4.99, '$')).toBe('$4.99')
    expect(formatValue(-60, '%')).toBe('-60%')
    expect(formatValue(8, 'x')).toBe('8x')
    expect(formatValue(2450, 'customers')).toBe('2,450 customers')
  })
})
