import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";
import { describe, expect, it } from "vitest";

import { Accordion } from "../Accordion";

expect.extend(toHaveNoViolations);

const items = [
  { question: "First question", answer: "First answer" },
  { question: "Unavailable question", answer: "Unavailable answer", disabled: true },
];

describe("Accordion", () => {
  it("uses unique, associated IDs and keeps panels mounted for grid animation", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Accordion items={items} />
        <Accordion items={items} />
      </>
    );
    const triggers = screen.getAllByRole("button");
    const ids = triggers.map((trigger) => trigger.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const trigger of triggers) {
      const panelId = trigger.getAttribute("aria-controls");
      const panel = document.getElementById(panelId ?? "");

      expect(panel).toHaveAttribute("role", "region");
      expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
      expect(panel).toHaveClass("grid-rows-[0fr]");
      expect(panel).toHaveAttribute("aria-hidden", "true");
    }

    await user.click(triggers[0]);
    const openPanel = document.getElementById(
      triggers[0].getAttribute("aria-controls") ?? ""
    );
    expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
    expect(openPanel).toHaveClass("grid-rows-[1fr]");
    expect(openPanel).toHaveAttribute("aria-hidden", "false");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not expand a disabled item", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);

    const disabledTrigger = screen.getByRole("button", {
      name: "Unavailable question",
    });
    await user.click(disabledTrigger);

    expect(disabledTrigger).toBeDisabled();
    expect(disabledTrigger).toHaveAttribute("aria-expanded", "false");
  });
});
