import { describe, expect, it } from "vitest";
import { buildInstructions } from "./coruja-prompt";

describe("buildInstructions", () => {
  it("defaults to Brazilian Portuguese", () => {
    expect(buildInstructions(null)).toContain("Responda sempre em português do Brasil.");
  });
  it("uses the chosen language", () => {
    expect(buildInstructions({ language: "en" })).toContain("Responda sempre em inglês.");
  });
  it("applies the short length limit", () => {
    expect(buildInstructions({ response_length: "short" })).toContain("no máximo 3 parágrafos");
  });
  it("includes blocked topics", () => {
    expect(buildInstructions({ blocked_topics: "política" })).toContain("Não fale sobre estes temas; recuse com educação se pedirem: política.");
  });
  it("includes custom privacy rules", () => {
    expect(buildInstructions({ privacy_rules: "Não guarde nomes." })).toContain("Não guarde nomes.");
  });
});
