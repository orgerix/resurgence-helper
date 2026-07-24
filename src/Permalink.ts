import { Relic } from './Types.ts'
import RelicState from './RelicState.ts'
import { parseRunMethod } from './Math.ts'

interface SerializedRelic {
  n: string
  a: number
  r: string
  o: string | undefined
  p: string[]
}

interface SerializedState {
  v: number
  relics: SerializedRelic[]
}

function serialize(relicStates: Map<string, RelicState>): string {
  const data: SerializedState = {
    v: 1,
    relics: [...relicStates.values()].map((s) => ({
      n: s.relic.name,
      a: s.amount ?? 1,
      r: s.run?.asString() ?? '',
      o: s.offcycle,
      p: [...s.relic.rewards]
        .sort(
          (a, b) =>
            (s.positions.get(a.item.id) ?? 0) -
            (s.positions.get(b.item.id) ?? 0)
        )
        .map((r) => r.item.name),
    })),
  }
  const json = JSON.stringify(data)
  const b64 = btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return b64
}

function deserialize(
  encoded: string,
  allRelics: Map<string, Relic>
): Map<string, RelicState> | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4)
    const data: SerializedState = JSON.parse(atob(padded))
    if (data.v !== 1 || !Array.isArray(data.relics)) return null

    const result = new Map<string, RelicState>()
    for (const sr of data.relics) {
      const relic = allRelics.get(sr.n)
      if (!relic) continue

      const state = new RelicState(relic)
      state.amount = sr.a
      if (sr.r) {
        state.run = parseRunMethod(sr.r)
      }
      state.offcycle = sr.o

      const positionMap = new Map<string, number>()
      sr.p.forEach((name, i) => {
        const reward = relic.rewards.find((r) => r.item.name === name)
        if (reward) positionMap.set(reward.item.id, i)
      })
      for (const reward of relic.rewards) {
        if (!positionMap.has(reward.item.id)) {
          positionMap.set(reward.item.id, sr.p.length)
        }
      }
      state.positions = positionMap

      result.set(sr.n, state)
    }
    return result
  } catch (e) {
    console.error('Failed to decode state:', e)
    return null
  }
}

function decodeFromURL(): string | null {
  return new URLSearchParams(window.location.search).get('state')
}

export { serialize, deserialize, decodeFromURL }
