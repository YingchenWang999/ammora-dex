import type { Hash } from 'viem'

export type ActivityItem = {
  id: string
  kind: 'claim' | 'swap' | 'add' | 'remove'
  symbol?: string
  hash: Hash
  timestamp: number
}

export function mergeActivityItems(...groups: readonly ActivityItem[][]): ActivityItem[] {
  const unique = new Map<string, ActivityItem>()
  groups.flat().forEach((item) => {
    const key = `${item.hash}-${item.kind}`
    const current = unique.get(key)
    if (!current || item.timestamp > current.timestamp) unique.set(key, item)
  })
  return [...unique.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
}
