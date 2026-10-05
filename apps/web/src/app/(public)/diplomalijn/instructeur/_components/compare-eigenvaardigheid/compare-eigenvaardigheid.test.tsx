import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompareEigenvaardigheid } from "./compare-eigenvaardigheid";
import { ModeToggle } from "./mode-toggle";
import type { ViewMode } from "./types";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
afterEach(cleanup);

describe("unpublished comparison data", () => {
  it("explains missing programs without asking for unavailable selections", () => {
    render(
      <CompareEigenvaardigheid disciplines={[]} canViewRequirements={false} />,
    );
    expect(
      screen.getByText(
        "Er zijn nog geen eigenvaardigheidsprogramma's gepubliceerd.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("explains a discipline with no published modules", () => {
    render(
      <CompareEigenvaardigheid
        canViewRequirements={false}
        disciplines={[
          {
            id: "kielboot",
            handle: "kielboot",
            title: "Kielboot",
            programPageHref: "/kielboot",
            levels: [
              {
                programId: "a",
                label: "NWD A",
                letter: "A",
                hasModules: false,
                modules: [],
              },
            ],
          },
        ]}
      />,
    );
    expect(
      screen.getByText(
        "Voor deze discipline zijn nog geen niveaus met modules gepubliceerd.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("combobox", { name: "Niveau" }),
    ).not.toBeInTheDocument();
  });
});

it("supports native radio selection with the keyboard", async () => {
  function Example() {
    const [mode, setMode] = useState<ViewMode>("beschrijving");
    return <ModeToggle value={mode} onChange={setMode} />;
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.tab();
  expect(screen.getByRole("radio", { name: "Beschrijving" })).toHaveFocus();
  await user.keyboard("{ArrowRight}");
  expect(
    screen.getByRole("radio", { name: "Verschil uitlichten" }),
  ).toBeChecked();
  expect(
    screen.getByRole("radio", { name: "Verschil uitlichten" }),
  ).toHaveFocus();
});
