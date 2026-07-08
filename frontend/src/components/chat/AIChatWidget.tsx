"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, X, MessageSquare, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

interface ProjectOption {
  id: string
  name: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  projects?: ProjectOption[]
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! Ask me anything about your team's reports, blockers, or projects." },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const sendQuestion = useCallback(async (question: string, projectId?: string) => {
    setLoading(true)
    try {
      const res = await api.ai.ask(question, projectId)
      if (res.requiresProjectSelection && res.projects?.length) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.answer || "Which project are you asking about?", projects: res.projects },
        ])
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: res.answer }])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sorry, I couldn't process that."
      setMessages((prev) => [...prev, { role: "assistant", content: msg }])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    await sendQuestion(userMsg)
  }

  const handleProjectSelect = async (projectId: string, question: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content: `Looking into that project...`, projects: undefined }])
    await sendQuestion(question, projectId)
  }

  return (
    <>
      <style>{`
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(16, 185, 129, 0.4), 0 0 20px 4px rgba(16, 185, 129, 0.15); }
  50% { box-shadow: 0 0 14px 5px rgba(16, 185, 129, 0.6), 0 0 35px 10px rgba(16, 185, 129, 0.25); }
}
.animate-glow {
  animation: glow-pulse 2s ease-in-out infinite;
}
`}</style>
      {!open && (
        <Button className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg" onClick={() => setOpen(true)}>
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
      {open && (
        <Card className="fixed bottom-6 right-6 w-80 sm:w-96 shadow-xl z-50 animate-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><CardTitle className="text-base">AI Assistant</CardTitle></div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80 px-4" ref={scrollRef}>
              <div className="space-y-4 py-2">
                {messages.map((msg, i) => (
                  <div key={i}>
                    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-2`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {msg.content}
                      </div>
                    </div>
                    {msg.projects && msg.projects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 ml-1">
                        {msg.projects.map((p) => (
                          <Button
                            key={p.id}
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs font-semibold border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500"
                            onClick={() => {
                              const userQ = messages.findLast((m) => m.role === "user")?.content || ""
                              handleProjectSelect(p.id, userQ)
                            }}
                          >
                            {p.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t">
              <Input placeholder="Ask about reports..." value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  )
}
