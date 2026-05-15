"use client"

import { useState } from "react"
import { MessageCircle, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatApiErrorField } from "@/lib/api-error-message"

type Msg = { role: "user" | "assistant"; content: string }

export function ContractChatPanel({
  contractId,
  initialMessages,
  chatEnabled,
  userPresent,
  initialChatUsage,
}: {
  contractId: string
  initialMessages: Msg[]
  chatEnabled: boolean
  userPresent: boolean
  initialChatUsage: { used: number; limit: number } | null
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(
    initialChatUsage,
  )

  async function send() {
    const text = input.trim()
    if (!text) return
    if (!chatEnabled) {
      if (!userPresent) {
        toast.error("Sign in to ask follow-up questions.")
      } else {
        toast.error("Upload this contract while signed in to enable chat.")
      }
      return
    }
    setSending(true)
    setInput("")
    setMessages((m) => [...m, { role: "user", content: text }])
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, message: text }),
      })
      const data = (await res.json()) as {
        reply?: string
        error?: unknown
        used?: number | null
        limit?: number | null
      }
      if (!res.ok) {
        setMessages((m) => m.slice(0, -1))
        toast.error(formatApiErrorField(data.error, "Could not send message"))
        return
      }
      if (data.reply != null && data.reply !== "") {
        setMessages((m) => [...m, { role: "assistant", content: data.reply as string }])
      }
      if (data.limit != null && data.used != null) {
        setUsage({ used: data.used, limit: data.limit })
      } else {
        setUsage(null)
      }
    } catch {
      setMessages((m) => m.slice(0, -1))
      toast.error("Network error")
    } finally {
      setSending(false)
    }
  }

  const banner = !userPresent ? (
    <p className="text-sm text-muted-foreground">
      Sign in to ask follow-up questions about this contract.
    </p>
  ) : !chatEnabled ? (
    <p className="text-sm text-muted-foreground">
      Clause chat is available for contracts saved to your account. Upload while signed in to
      enable chat.
    </p>
  ) : null

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="fixed bottom-6 right-4 z-40 rounded-full shadow-lg sm:right-6"
        style={{ backgroundColor: "#E8401C" }}
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="mr-2 size-5" />
        Ask AI
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 p-4 sm:items-stretch sm:justify-end sm:p-0">
          <div className="flex h-[min(560px,85vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:h-full sm:max-w-md sm:rounded-none">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Clause chat</p>
                {chatEnabled && usage != null ? (
                  <p className="text-xs text-muted-foreground">
                    {usage.used}/{usage.limit} questions used
                  </p>
                ) : null}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <Separator />
            <ScrollArea className="min-h-0 flex-1 p-4">
              <div className="flex flex-col gap-3 pr-2">
                {banner}
                {messages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={
                      m.role === "user"
                        ? "ml-6 rounded-lg bg-muted px-3 py-2 text-sm"
                        : "mr-6 rounded-lg border bg-card px-3 py-2 text-sm"
                    }
                  >
                    {m.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-3">
              <Textarea
                rows={3}
                placeholder="Ask about a clause..."
                value={input}
                disabled={!chatEnabled || sending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={() => void send()}
                  disabled={!chatEnabled || sending}
                  className="bg-[#1A3C5E] text-white hover:bg-[#15324d]"
                >
                  <Send className="mr-2 size-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
