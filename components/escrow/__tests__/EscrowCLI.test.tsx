import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

import { EscrowCLI } from "../EscrowCLI";

function getPromptInput() {
  return screen.getByPlaceholderText("Enter command...");
}

async function runCommand(user: ReturnType<typeof userEvent.setup>, command: string) {
  await user.type(getPromptInput(), `${command}{Enter}`);
}

describe("EscrowCLI", () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error");
  });

  afterEach(() => {
    // Guards against act() warnings and unexpected React errors leaking into test output.
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  describe("rendering", () => {
    it("renders the welcome message and a command prompt", () => {
      render(<EscrowCLI />);

      expect(
        screen.getByText(
          'Welcome to the Escrow CLI. Type "help" for a list of commands.'
        )
      ).toBeInTheDocument();
      expect(getPromptInput()).toHaveValue("");
      expect(screen.getByText(">")).toBeInTheDocument();
    });

    it("shows only the welcome line before any command is run", () => {
      render(<EscrowCLI />);

      expect(screen.getAllByText(/.+/)).toHaveLength(2); // welcome + ">"
    });
  });

  describe("user interactions", () => {
    it("echoes the submitted command and clears the input", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "status");

      expect(screen.getByText("> status")).toBeInTheDocument();
      expect(getPromptInput()).toHaveValue("");
    });

    it("prints available commands for 'help'", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "help");

      expect(
        screen.getByText("Available commands: help, status, create, refund")
      ).toBeInTheDocument();
    });

    it("prints escrow status for 'status'", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "status");

      expect(screen.getByText("Escrow #1234: IN PROGRESS")).toBeInTheDocument();
    });

    it("prints creation output for 'create'", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "create");

      expect(
        screen.getByText("Creating new escrow transaction... Done.")
      ).toBeInTheDocument();
    });

    it("prints refund output for 'refund'", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "refund");

      expect(
        screen.getByText("Initiating refund for current escrow...")
      ).toBeInTheDocument();
    });

    it("recognizes commands case-insensitively", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "HELP");

      expect(
        screen.getByText("Available commands: help, status, create, refund")
      ).toBeInTheDocument();
      expect(screen.getByText("> HELP")).toBeInTheDocument();
    });

    it("trims surrounding whitespace before running a command", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "  status  ");

      expect(screen.getByText("> status")).toBeInTheDocument();
      expect(screen.getByText("Escrow #1234: IN PROGRESS")).toBeInTheDocument();
    });

    it("accumulates command history across multiple commands", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "help");
      await runCommand(user, "status");

      expect(screen.getByText("> help")).toBeInTheDocument();
      expect(screen.getByText("Available commands: help, status, create, refund")).toBeInTheDocument();
      expect(screen.getByText("> status")).toBeInTheDocument();
      expect(screen.getByText("Escrow #1234: IN PROGRESS")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("ignores submissions of an empty command", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await user.click(getPromptInput());
      await user.keyboard("{Enter}");

      expect(
        screen.getByText(
          'Welcome to the Escrow CLI. Type "help" for a list of commands.'
        )
      ).toBeInTheDocument();
      expect(screen.queryByText(/^> $/)).not.toBeInTheDocument();
      // welcome + ">" prompt only
      expect(screen.getAllByText(/.+/)).toHaveLength(2);
    });

    it("ignores submissions of whitespace only", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "   ");

      expect(screen.getAllByText(/.+/)).toHaveLength(2);
    });

    it("reports unknown commands", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await runCommand(user, "deploy");

      expect(screen.getByText("Command not recognized: deploy")).toBeInTheDocument();
    });

    it("updates the input as the user types without submitting", async () => {
      const user = userEvent.setup();
      render(<EscrowCLI />);

      await user.type(getPromptInput(), "stat");

      expect(getPromptInput()).toHaveValue("stat");
      expect(screen.getAllByText(/.+/)).toHaveLength(2);
    });
  });
});
