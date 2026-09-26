import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import Footer from "../Footer";

// Mock react-i18next
const mockChangeLanguage = vi.fn();
const mockTranslate = vi.fn((key) => {
  const translations: Record<string, string> = {
    "footer.copyright": "Trust Link. All rights reserved.",
    "footer.language": "Language",
    "footer.selectLanguage": "Select language",
  };
  return translations[key] || key;
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockTranslate,
    i18n: {
      language: "en",
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("matches snapshot", () => {
    const { container } = render(<Footer />);
    expect(container).toMatchSnapshot();
  });

  it("displays copyright year dynamically", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it("displays language selector with English and French options", () => {
    render(<Footer />);
    const select = screen.getByRole("combobox", { name: /select language/i });
    expect(select).toBeInTheDocument();
    
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue("en");
    expect(options[1]).toHaveValue("fr");
    expect(options[2]).toHaveValue("pcm");
  });

  it("calls changeLanguage when selecting a different language", async () => {
    render(<Footer />);
    const select = screen.getByRole("combobox", { name: /select language/i });
    
    fireEvent.change(select, { target: { value: "fr" } });
    
    await waitFor(() => {
      expect(mockChangeLanguage).toHaveBeenCalledWith("fr");
    });
  });

  it("displays copyright text from translation", () => {
    render(<Footer />);
    expect(screen.getByText(/Trust Link\. All rights reserved\./)).toBeInTheDocument();
  });

  it("renders footer element with proper accessibility", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();
  });

  it("has proper border styling for dark and light modes", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).toHaveClass("border-t", "border-zinc-200", "dark:border-zinc-800");
  });

  it("language select has proper aria-label", () => {
    render(<Footer />);
    const select = screen.getByLabelText(/select language/i);
    expect(select).toBeInTheDocument();
  });
});
