import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, LANGUAGES, LENGTHS, type CorujaSettings } from "@/lib/coruja-prompt";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes do Coruja" },
      { name: "description", content: "Ajuste idioma, temas, tamanho das respostas e privacidade do Coruja." },
      { property: "og:title", content: "Ajustes do Coruja" },
      { property: "og:description", content: "Ajuste idioma, temas, tamanho das respostas e privacidade do Coruja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

async function loadSettings(): Promise<CorujaSettings> {
  const { data, error } = await supabase.from("user_settings").select("*").maybeSingle();
  if (error) throw error;
  return data ?? DEFAULT_SETTINGS;
}

function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: loadSettings });
  const [s, setS] = useState<CorujaSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q.data) setS(q.data);
  }, [q.data]);

  const set = <K extends keyof CorujaSettings>(k: K, v: CorujaSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("user_settings").upsert({
      user_id: u.user!.id,
      language: s.language,
      topics: s.topics,
      blocked_topics: s.blocked_topics,
      response_length: s.response_length,
      privacy_rules: s.privacy_rules,
      save_history: s.save_history,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar.");
    qc.invalidateQueries({ queryKey: ["settings"] });
    toast.success("Ajustes salvos. Valem a partir da próxima mensagem.");
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1">
          <Link to="/chat">
            <ArrowLeft className="size-4" /> Voltar às conversas
          </Link>
        </Button>
        <h1 className="font-display text-3xl font-bold">Ajustes do Coruja</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha como o Coruja deve responder para você.</p>

        <div className="mt-6 space-y-5">
          <Section title="Idioma">
            <Select value={s.language} onValueChange={(v) => set("language", v)}>
              <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{k === "auto" ? "Automático (igual ao seu)" : v[0]!.toUpperCase() + v.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Section title="Temas">
            <Field id="topics" label="Temas preferidos" hint="Ex.: Python, React, carreira em tecnologia">
              <Textarea id="topics" value={s.topics} onChange={(e) => set("topics", e.target.value)} maxLength={500} />
            </Field>
            <Field id="blocked" label="Temas proibidos" hint="O Coruja vai recusar com educação. Ex.: política, apostas">
              <Textarea id="blocked" value={s.blocked_topics} onChange={(e) => set("blocked_topics", e.target.value)} maxLength={500} />
            </Field>
          </Section>

          <Section title="Tamanho das respostas">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(LENGTHS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => set("response_length", k)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    s.response_length === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Privacidade">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="history">Salvar histórico das conversas</Label>
                <p className="text-xs text-muted-foreground">Desligado, as novas mensagens não ficam guardadas.</p>
              </div>
              <Switch id="history" checked={s.save_history} onCheckedChange={(v) => set("save_history", v)} />
            </div>
            <Field id="privacy" label="Regras extras" hint="Ex.: não repita meu nome, não sugira serviços pagos">
              <Textarea id="privacy" value={s.privacy_rules} onChange={(e) => set("privacy_rules", e.target.value)} maxLength={500} />
            </Field>
          </Section>

          <Button onClick={save} disabled={saving || q.isLoading} className="w-full sm:w-auto">
            {saving ? "Salvando…" : "Salvar ajustes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
