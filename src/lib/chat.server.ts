import { convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { createResponsesCall } from "./ai/responses";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const INSTRUCTIONS = `Você é o Coruja, um assistente simpático e direto que fala português do Brasil.
Sua especialidade é programação (explicar conceitos, revisar e escrever código, depurar erros),
mas você também conversa sobre qualquer outro assunto com prazer.
Use markdown, e sempre coloque código em blocos com a linguagem indicada.`;

function json(status: number, error: string) {
  return Response.json({ error }, { status });
}

function textOf(message: UIMessage) {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

export async function handleChat(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, "Faça login para conversar.");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "IA não configurada.");

  const supabase = createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json(401, "Sessão expirada. Entre novamente.");

  let body: { threadId?: string; messages?: UIMessage[] };
  try {
    body = await request.json();
  } catch {
    return json(400, "Requisição inválida.");
  }
  const { threadId, messages } = body;
  if (!threadId || !Array.isArray(messages) || messages.length === 0) {
    return json(400, "Requisição inválida.");
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) return json(404, "Conversa não encontrada.");

  const last = messages[messages.length - 1];
  if (last && last.role === "user") {
    const { error } = await supabase.from("messages").upsert(
      {
        thread_id: threadId,
        ui_id: last.id,
        role: "user",
        message: last as unknown as Json,
      },
      { onConflict: "thread_id,ui_id" },
    );
    if (error) {
      console.error("save user message", error);
      return json(500, "Não foi possível salvar sua mensagem.");
    }
    const update: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
    if (thread.title === "Nova conversa") {
      const t = textOf(last);
      if (t) update.title = t.length > 60 ? `${t.slice(0, 57)}…` : t;
    }
    await supabase.from("threads").update(update).eq("id", threadId);
  }

  const call = createResponsesCall(
    request,
    { baseURL: GATEWAY, apiKey, model: MODEL },
    await convertToModelMessages(messages),
    INSTRUCTIONS,
  );

  return call.response({
    originalMessages: messages,
    generateMessageId: () => crypto.randomUUID(),
    onError: (error) => {
      console.error("chat error", error);
      const status = (error as { statusCode?: number })?.statusCode;
      if (status === 429) return "Muitas mensagens seguidas. Aguarde um pouco e tente de novo.";
      if (status === 402) return "Os créditos de IA acabaram. Adicione créditos para continuar.";
      return "Algo deu errado ao gerar a resposta.";
    },
    onFinish: async ({ responseMessage, isAborted }) => {
      if (!responseMessage || responseMessage.parts.length === 0) return;
      const { error } = await supabase.from("messages").upsert(
        {
          thread_id: threadId,
          ui_id: responseMessage.id,
          role: "assistant",
          message: responseMessage as unknown as Json,
        },
        { onConflict: "thread_id,ui_id" },
      );
      if (error) console.error("save assistant message", error, { isAborted });
    },
  });
}
