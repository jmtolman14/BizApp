import { describe, expect, it } from 'vitest'
import { APP_NAME } from '../config'
import { buildShareText } from './share'

describe('buildShareText', () => {
  it('matches the spec format', () => {
    const text = buildShareText('2026-10-01', [92, 85, 70, 45, 10], 677, 'https://biztap.app')
    expect(text).toBe(`${APP_NAME} Oct 1\n🟩🟩🟨🟧🟥 677/1000\nhttps://biztap.app`)
  })

  it('omits the URL line when there is no URL', () => {
    expect(buildShareText('2026-12-25', [100], 100, '').split('\n')).toHaveLength(2)
  })
})
