import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Coruja — Chatbot de programação" },
      { name: "description", content: "Converse com o Coruja sobre programação e qualquer outro assunto." },
      { property: "og:title", content: "Coruja — Chatbot de programação" },
      { property: "og:description", content: "Converse com o Coruja sobre programação e qualquer outro assunto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/chat" : "/auth" });
  },
});
