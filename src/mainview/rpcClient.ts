import { Electroview } from 'electrobun/view'
import type { LopBoxRPC } from '@shared/rpc'

type Rpc = ReturnType<typeof Electroview.defineRPC<LopBoxRPC>>

let electroview: Electroview | null = null
let rpc: Rpc | null = null
let ready: Promise<void> | null = null

export function initRpc(): Promise<void> {
  if (ready) return ready

  ready = Promise.resolve().then(() => {
    rpc = Electroview.defineRPC<LopBoxRPC>({
      handlers: {
        requests: {
          noop: () => undefined
        },
        messages: {
          logToWebview: ({ msg }) => {
            console.log('[bun]', msg)
          }
        }
      }
    })
    electroview = new Electroview({ rpc })
    console.log('[rpc] Electroview ready')
  })

  return ready
}

export function getRpc(): NonNullable<Electroview['rpc']> {
  if (!electroview?.rpc) {
    throw new Error('RPC not initialized — call await initRpc() first')
  }
  return electroview.rpc
}

export async function rpcRequest<K extends keyof LopBoxRPC['bun']['requests']>(
  method: K,
  ...args: LopBoxRPC['bun']['requests'][K]['params'] extends void
    ? []
    : [LopBoxRPC['bun']['requests'][K]['params']]
): Promise<LopBoxRPC['bun']['requests'][K]['response']> {
  await initRpc()
  const client = getRpc()
  // Electrobun request methods are functions on rpc.request
  const fn = (client.request as Record<string, (p?: unknown) => Promise<unknown>>)[
    method as string
  ]
  if (!fn) {
    throw new Error(`RPC method not found: ${String(method)}`)
  }
  const params = args[0]
  return fn(params) as Promise<LopBoxRPC['bun']['requests'][K]['response']>
}
