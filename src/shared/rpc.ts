import type { RPCSchema } from 'electrobun/view'

/**
 * Generic RPC: renderer calls `call({ method, args })` matching `window.api` method names.
 * Bun pushes events via webview messages (timer, rest modal, screenshot).
 */
export type LopBoxRPC = {
  bun: RPCSchema<{
    requests: {
      call: {
        params: { method: string; args?: unknown[] }
        response: unknown
      }
    }
    messages: {
      logFromWebview: { msg: string }
    }
  }>
  webview: RPCSchema<{
    requests: {
      /** Ask webview to capture UI as PNG base64 */
      captureScreenshot: {
        params: void
        response: { ok: boolean; dataUrl?: string; error?: string }
      }
    }
    messages: {
      timerUpdate: { elapsedTime: number }
      timerStopped: {
        code: number
        finalElapsedTime: number
        error?: string
      }
      openRestTimeModal: Record<string, never>
      screenshotSuccess: { path: string; filename: string }
      screenshotError: { error: string }
      requestScreenshot: Record<string, never>
      logToWebview: { msg: string }
    }
  }>
}
