"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { createChatSession, sendChatMessage } from "@/app/actions";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AIChatPanelProps {
  chatSessions: any[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function AIChatPanel({ chatSessions: initialSessions }: AIChatPanelProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null
  );
  const [showSessions, setShowSessions] = useState(sessions.length === 0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      const session = sessions.find((s: any) => s.id === activeSessionId);
      if (session?.messages) {
        setMessages(
          session.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      } else {
        setMessages([]);
      }
      setShowSessions(false);
    }
  }, [activeSessionId, sessions]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewSession = () => {
    startTransition(async () => {
      const session = await createChatSession();
      setSessions((prev: any[]) => [{ ...session, messages: [] }, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      setShowSessions(false);
      inputRef.current?.focus();
    });
  };

  const handleSend = () => {
    if (!input.trim() || !activeSessionId) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input.trim();
    setInput("");

    startTransition(async () => {
      try {
        const assistantMessage = await sendChatMessage(
          activeSessionId,
          messageContent
        );
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessage.id,
            role: "assistant" as const,
            content: assistantMessage.content,
            createdAt: new Date(assistantMessage.createdAt).toISOString(),
          },
        ]);
        // Update session title
        setSessions((prev: any[]) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, title: messageContent.slice(0, 50) }
              : s
          )
        );
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sessions list view
  if (showSessions || !activeSessionId) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h3 className="text-sm font-semibold">AI Chat</h3>
          <Button
            size="xs"
            variant="outline"
            onClick={handleNewSession}
            disabled={isPending}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            New
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 mb-3">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm font-medium mb-1">AI Trading Assistant</p>
              <p className="text-xs text-muted-foreground mb-4">
                Get insights about your trading performance, patterns, and
                improvement areas.
              </p>
              <Button
                size="sm"
                onClick={handleNewSession}
                disabled={isPending}
                className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5" />
                )}
                Start a Chat
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session: any) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      {session.title || "New Chat"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Active chat view
  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2.5">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setShowSessions(true)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {sessions.find((s: any) => s.id === activeSessionId)?.title ||
              "New Chat"}
          </p>
        </div>
        <Button
          size="xs"
          variant="outline"
          onClick={handleNewSession}
          disabled={isPending}
          className="gap-1"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 mb-3">
              <Sparkles className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Ask me about your trading performance, patterns, or areas for
              improvement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 border border-border/40"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {message.content.split("\n").map((line, i) => {
                      // Simple markdown rendering for bold text
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <span key={i}>
                          {i > 0 && <br />}
                          {parts.map((part, j) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return (
                                <strong key={j}>
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return <span key={j}>{part}</span>;
                          })}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <div className="rounded-xl bg-muted/50 border border-border/40 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/40 p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your trades..."
            disabled={isPending}
            className="flex-1 text-sm"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
