export type CorujaSettings = {
  language: string;
  topics: string;
  blocked_topics: string;
  response_length: string;
  privacy_rules: string;
  save_history: boolean;
};

export const DEFAULT_SETTINGS: CorujaSettings = {
  language: "pt-BR",
  topics: "",
  blocked_topics: "",
  response_length: "medium",
  privacy_rules: "",
  save_history: true,
};

export const LANGUAGES: Record<string, string> = {
  "pt-BR": "português do Brasil",
  en: "inglês",
  es: "espanhol",
  fr: "francês",
  auto: "o mesmo idioma usado pelo usuário",
};

export const LENGTHS: Record<string, { label: string; rule: string }> = {
  short: { label: "Curta", rule: "Seja breve: no máximo 3 parágrafos curtos, salvo quando o código exigir mais." },
  medium: { label: "Média", rule: "Use um tamanho equilibrado: completo, mas sem rodeios." },
  long: { label: "Detalhada", rule: "Dê respostas detalhadas, com explicações passo a passo e exemplos." },
};

export function buildInstructions(input: Partial<CorujaSettings> | null | undefined): string {
  const s = { ...DEFAULT_SETTINGS, ...(input ?? {}) };
  const lang = LANGUAGES[s.language] ?? LANGUAGES["pt-BR"];
  const length = LENGTHS[s.response_length] ?? LENGTHS["medium"]!;
  const lines = [
    "Você é o Coruja, um assistente simpático e direto.",
    `Responda sempre em ${lang}.`,
    "Sua especialidade é programação (explicar conceitos, revisar e escrever código, depurar erros), mas você também conversa sobre outros assuntos.",
    "Use markdown e coloque código em blocos com a linguagem indicada.",
    length.rule,
  ];
  if (s.topics.trim()) lines.push(`Dê prioridade a estes temas: ${s.topics.trim()}.`);
  if (s.blocked_topics.trim())
    lines.push(`Não fale sobre estes temas; recuse com educação se pedirem: ${s.blocked_topics.trim()}.`);
  lines.push("Nunca peça dados pessoais sensíveis (senhas, documentos, cartões).");
  if (s.privacy_rules.trim()) lines.push(`Regras de privacidade do usuário: ${s.privacy_rules.trim()}`);
  return lines.join("\n");
}
