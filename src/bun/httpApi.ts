import type { Server } from 'bun'
import { dispatchApi, type ApiContext } from './apiHandlers'

export type SseClient = {
  id: number
  controller: ReadableStreamDefaultController<Uint8Array>
}

/**
 * Local HTTP API + SSE event bus.
 * More reliable on Windows WebView2 than hostObjects postMessage RPC.
 */
export function startHttpApi(
  ctx: ApiContext,
  preferredPort = 39212
): {
  port: number
  baseUrl: string
  broadcast: (event: string, data: unknown) => void
  stop: () => void
} {
  let nextClientId = 1
  const clients = new Map<number, SseClient>()
  const encoder = new TextEncoder()

  const broadcast = (event: string, data: unknown) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    const bytes = encoder.encode(payload)
    for (const [, client] of clients) {
      try {
        client.controller.enqueue(bytes)
      } catch {
        clients.delete(client.id)
      }
    }
  }

  // Expose broadcast on ctx events via outer wiring
  const server: Server = Bun.serve({
    port: preferredPort,
    hostname: '127.0.0.1',
    async fetch(req) {
      const url = new URL(req.url)

      // CORS for views:// and vite origin
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders()
        })
      }

      if (url.pathname === '/health') {
        return json({ ok: true })
      }

      // Server-Sent Events for push (timer, rest modal, screenshot)
      if (url.pathname === '/events') {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const id = nextClientId++
            clients.set(id, { id, controller })
            controller.enqueue(encoder.encode(`event: hello\ndata: ${JSON.stringify({ id })}\n\n`))
            // heartbeat
            const hb = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(`: ping\n\n`))
              } catch {
                clearInterval(hb)
                clients.delete(id)
              }
            }, 15000)
            // store timer on controller via weak map-ish: close clears
            ;(controller as unknown as { _hb?: ReturnType<typeof setInterval> })._hb = hb
          },
          cancel() {
            // cleaned when enqueue fails
          }
        })

        return new Response(stream, {
          headers: {
            ...corsHeaders(),
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
          }
        })
      }

      // POST /api/call  { method, args }
      if (url.pathname === '/api/call' && req.method === 'POST') {
        try {
          const body = (await req.json()) as { method?: string; args?: unknown[] }
          const method = body.method
          if (!method || typeof method !== 'string') {
            return json({ error: 'method required' }, 400)
          }
          const started = Date.now()
          console.log(`[HTTP] → ${method}`, body.args?.length ? body.args : '')
          const result = await dispatchApi(ctx, method, body.args ?? [])
          console.log(`[HTTP] ← ${method} (${Date.now() - started}ms)`)
          return json({ ok: true, result })
        } catch (err) {
          console.error('[HTTP] call failed:', err)
          return json(
            {
              ok: false,
              error: err instanceof Error ? err.message : String(err)
            },
            500
          )
        }
      }

      return json({ error: 'not found' }, 404)
    }
  })

  const baseUrl = `http://127.0.0.1:${server.port}`
  console.log('[HTTP] API at', baseUrl)

  return {
    port: server.port,
    baseUrl,
    broadcast,
    stop: () => {
      clients.clear()
      server.stop(true)
    }
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json'
    }
  })
}
