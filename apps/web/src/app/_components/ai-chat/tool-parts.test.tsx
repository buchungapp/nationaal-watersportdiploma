// Component tests for the tool-part renderer.
//
// Covers the four states of an AI SDK v5+ tool part:
//   - input-streaming / input-available: busy pill
//   - output-available: per-tool renderer (or generic disclosure)
//   - output-error: error pill
// Plus the isToolPart type guard.

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { isToolPart, ToolPartRenderer } from "./tool-parts";

afterEach(() => {
  cleanup();
});

describe("isToolPart", () => {
  test("matches `tool-<name>` parts", () => {
    expect(
      isToolPart({ type: "tool-searchBewijsExamples", state: "output-available" }),
    ).toBe(true);
  });

  test("matches `dynamic-tool` parts (SDK variant)", () => {
    expect(isToolPart({ type: "dynamic-tool", state: "input-available" })).toBe(
      true,
    );
  });

  test("rejects plain text parts", () => {
    expect(isToolPart({ type: "text", text: "hi" })).toBe(false);
  });

  test("rejects non-objects", () => {
    expect(isToolPart(null)).toBe(false);
    expect(isToolPart("string")).toBe(false);
    expect(isToolPart(42)).toBe(false);
  });
});

describe("ToolPartRenderer — busy state", () => {
  test("shows the labelled busy pill with a spinner while input is streaming", () => {
    render(
      <ToolPartRenderer
        part={{
          type: "tool-searchBewijsExamples",
          state: "input-streaming",
          toolCallId: "call-1",
        }}
      />,
    );
    expect(
      screen.getByText(/zoekt voorbeelden in geslaagde portfolio/i),
    ).toBeInTheDocument();
  });

  test("shows busy pill for input-available too (tool executing)", () => {
    render(
      <ToolPartRenderer
        part={{
          type: "tool-searchBewijsExamples",
          state: "input-available",
          toolCallId: "call-1",
          input: { werkprocesRang: 1, criteriumRang: 2 },
        }}
      />,
    );
    expect(
      screen.getByText(/zoekt voorbeelden/i),
    ).toBeInTheDocument();
  });
});

describe("ToolPartRenderer — searchBewijsExamples success", () => {
  test("renders metadata only; never surfaces the raw example content", () => {
    render(
      <ToolPartRenderer
        part={{
          type: "tool-searchBewijsExamples",
          state: "output-available",
          toolCallId: "call-1",
          output: {
            ok: true,
            werkprocesTitel: "Begeleidt cursisten",
            criteriumTitel: "Motiveert, enthousiasmeert en stimuleert",
            examples: [
              {
                content: "In week 14 gaf ik een training aan...",
                wordCount: 130,
                concretenessScore: 2.4,
                sourceRef: "seed:alle_niveau_3_bob",
              },
              {
                content: "Tijdens de SBF-week observeerde ik...",
                wordCount: 180,
                concretenessScore: 3.1,
                sourceRef: "seed:alle_niveau_4_kevin",
              },
            ],
          },
        }}
      />,
    );

    // User sees: count + criterium title. The model still receives
    // the examples internally via its tool result.
    expect(screen.getByText(/2 voorbeelden/i)).toBeInTheDocument();
    expect(
      screen.getByText(/motiveert, enthousiasmeert en stimuleert/i),
    ).toBeInTheDocument();

    // Raw example content + source refs MUST NOT leak to the DOM —
    // examples come from other kandidaten's anonymised portfolios
    // and the model is supposed to paraphrase, not let the user
    // read + copy the text verbatim.
    expect(
      screen.queryByText(/in week 14 gaf ik een training/i),
    ).toBeNull();
    expect(
      screen.queryByText(/tijdens de sbf-week observeerde ik/i),
    ).toBeNull();
    expect(screen.queryByText(/seed:alle_niveau_3_bob/i)).toBeNull();
    expect(screen.queryByText(/130 woorden/i)).toBeNull();
  });

  test("handles singular vs plural correctly", () => {
    render(
      <ToolPartRenderer
        part={{
          type: "tool-searchBewijsExamples",
          state: "output-available",
          toolCallId: "call-1",
          output: {
            ok: true,
            werkprocesTitel: "Begeleidt cursisten",
            criteriumTitel: "Een criterium",
            examples: [
              {
                content: "x",
                wordCount: 10,
                concretenessScore: null,
                sourceRef: "seed:portfolio_a",
              },
            ],
          },
        }}
      />,
    );
    expect(screen.getByText(/1 voorbeeld\b/i)).toBeInTheDocument();
    // No plural "en"
    expect(screen.queryByText(/1 voorbeelden/i)).not.toBeInTheDocument();
  });

  test("falls back to a generic disclosure if output doesn't match the expected shape", () => {
    render(
      <ToolPartRenderer
        part={{
          type: "tool-searchBewijsExamples",
          state: "output-available",
          toolCallId: "call-1",
          output: { garbage: true },
        }}
      />,
    );
    expect(
      screen.getByText(/searchBewijsExamples — klaar/i),
    ).toBeInTheDocument();
  });
});

describe("ToolPartRenderer — searchBewijsExamples no-results", () => {
  test("shows an amber pill with the reason when ok:false", () => {
    render(
      <ToolPartRenderer
        part={{
          type: "tool-searchBewijsExamples",
          state: "output-available",
          toolCallId: "call-1",
          output: {
            ok: false,
            reason:
              "geen voorbeelden beschikbaar voor dit criterium (corpus heeft er nog geen)",
          },
        }}
      />,
    );
    expect(screen.getByText(/geen voorbeelden gevonden/i)).toBeInTheDocument();
    expect(screen.getByText(/corpus heeft er nog geen/i)).toBeInTheDocument();
  });
});

describe("ToolPartRenderer — error state", () => {
  test("renders the error pill with errorText when available", () => {
    render(
      <ToolPartRenderer
        part={{
          type: "tool-searchBewijsExamples",
          state: "output-error",
          toolCallId: "call-1",
          errorText: "gateway timeout",
        }}
      />,
    );
    expect(screen.getByText(/voorbeelden ophalen mislukt/i)).toBeInTheDocument();
    expect(screen.getByText(/gateway timeout/i)).toBeInTheDocument();
  });
});

describe("ToolPartRenderer — unknown tool fallback", () => {
  test("renders a generic humanized label for unknown tools", () => {
    render(
      <ToolPartRenderer
        part={{
          type: "tool-proposeBewijsDraft",
          state: "input-streaming",
          toolCallId: "call-1",
        }}
      />,
    );
    // Falls back to the camelCase→spaced pattern.
    expect(screen.getByText(/voert propose bewijs draft uit/i)).toBeInTheDocument();
  });

  test("generic disclosure opens to show raw input/output JSON", async () => {
    const user = userEvent.setup();
    render(
      <ToolPartRenderer
        part={{
          type: "tool-proposeBewijsDraft",
          state: "output-available",
          toolCallId: "call-1",
          input: { topic: "motivatie" },
          output: { draft: "concept bewijs" },
        }}
      />,
    );
    // Disclosure is closed by default.
    expect(screen.queryByText(/concept bewijs/i)).not.toBeInTheDocument();
    await user.click(screen.getByText(/propose bewijs draft — klaar/i));
    expect(screen.getByText(/concept bewijs/i)).toBeInTheDocument();
    expect(screen.getByText(/motivatie/i)).toBeInTheDocument();
  });
});
