import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut, Menu, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createThread, deleteThread, getThreadMessages, listThreads } from "@/lib/threads";
import { ChatWindow } from "@/components/chat-window";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversa — Coruja" },
      { name: "description", content: "Converse com o Coruja sobre programação e muito mais." },
      { property: "og:title", content: "Conversa — Coruja" },
      { property: "og:description", content: "Converse com o Coruja sobre programação e muito mais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const threads = useQuery({ queryKey: ["threads"], queryFn: listThreads });
  const messages = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => getThreadMessages(threadId),
    staleTime: Infinity,
  });

  async function newThread() {
    try {
      const t = await createThread();
      await qc.invalidateQueries({ queryKey: ["threads"] });
      setOpen(false);
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    } catch {
      toast.error("Não foi possível criar a conversa.");
    }
  }

  async function remove(id: string) {
    try {
      await deleteThread(id);
      const rest = (threads.data ?? []).filter((t) => t.id !== id);
      await qc.invalidateQueries({ queryKey: ["threads"] });
      if (id === threadId) {
        if (rest[0]) navigate({ to: "/chat/$threadId", params: { threadId: rest[0].id } });
        else navigate({ to: "/chat" });
      }
    } catch {
      toast.error("Não foi possível apagar.");
    }
  }

  return (
    <div className="flex h-dvh bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 p-4">
          <img src={logo} alt="" width={32} height={32} className="size-8" />
          <span className="font-display text-lg font-bold">Coruja</span>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X />
          </Button>
        </div>
        <div className="px-3">
          <Button onClick={newThread} className="w-full justify-start gap-2">
            <Plus className="size-4" /> Nova conversa
          </Button>
        </div>
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
          {threads.data?.map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center rounded-md text-sm",
                t.id === threadId ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
              )}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                onClick={() => setOpen(false)}
                className="flex-1 truncate px-3 py-2"
              >
                {t.title}
              </Link>
              <button
                onClick={() => remove(t.id)}
                className="mr-1 rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                aria-label="Apagar conversa"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Button asChild variant="ghost" className="w-full justify-start gap-2">
            <Link to="/settings">
              <SlidersHorizontal className="size-4" /> Ajustes do Coruja
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => supabase.auth.signOut()}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-foreground/30 md:hidden" onClick={() => setOpen(false)} />}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu />
          </Button>
          <span className="truncate font-display font-semibold">
            {threads.data?.find((t) => t.id === threadId)?.title ?? "Coruja"}
          </span>
        </header>
        {messages.isSuccess ? (
          <ChatWindow
            key={threadId}
            threadId={threadId}
            initialMessages={messages.data}
            onFinished={() => qc.invalidateQueries({ queryKey: ["threads"] })}
          />
        ) : messages.isError ? (
          <p className="m-auto text-sm text-destructive">Não foi possível carregar a conversa.</p>
        ) : (
          <div className="flex-1" />
        )}
      </main>
    </div>
  );
}
