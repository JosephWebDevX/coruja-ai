import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

export type Thread = { id: string; title: string; updated_at: string };

export async function listThreads(): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("threads")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createThread(): Promise<Thread> {
  const { data, error } = await supabase
    .from("threads")
    .insert({})
    .select("id, title, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("threads").delete().eq("id", id);
  if (error) throw error;
}

export async function getThreadMessages(threadId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("message")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((r) => r.message as unknown as UIMessage);
}
