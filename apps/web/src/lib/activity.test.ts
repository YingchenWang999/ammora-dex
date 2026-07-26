import { describe, expect, it } from 'vitest'
import { mergeActivityItems, type ActivityItem } from './activity'

const hash = '0x1111111111111111111111111111111111111111111111111111111111111111'

describe('Ammora activity history', () => {
  it('deduplicates optimistic and mined events and keeps newest first', () => {
    const optimistic: ActivityItem = { id: 'local', kind: 'swap', symbol: 'aETH → aUSD', hash, timestamp: 20 }
    const mined: ActivityItem = { ...optimistic, id: 'mined', timestamp: 10 }
    const claim: ActivityItem = { id: 'claim', kind: 'claim', symbol: 'aETH', hash, timestamp: 30 }

    expect(mergeActivityItems([mined, claim], [optimistic])).toEqual([claim, optimistic])
  })
})
