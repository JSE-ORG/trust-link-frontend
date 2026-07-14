"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

/**
 * Interactive FAQ accordion using a CSS grid-rows transition.
 *
 * Using `grid-template-rows: 0fr → 1fr` keeps the answer panel in the DOM at
 * all times (zero CLS) while still providing a smooth height animation.
 * This avoids the layout shift that occurs when content is conditionally
 * mounted/unmounted.
 */
export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border border-[var(--border)] rounded-xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-[var(--muted-bg)]/50 transition-colors"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
              id={`faq-trigger-${index}`}
            >
              <span className="text-lg font-semibold text-[var(--foreground)] pr-4">
                {item.question}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`h-5 w-5 text-[var(--muted)] flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {/*
              grid-rows-[0fr] → grid-rows-[1fr] is the "animate to auto height"
              technique: the inner div has overflow-hidden so the 0fr grid row
              collapses it to zero height without removing it from the DOM.
              This keeps cumulative layout shift at zero while still animating.
            */}
            <div
              id={`faq-panel-${index}`}
              role="region"
              aria-labelledby={`faq-trigger-${index}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-6 pt-0 bg-[var(--muted-bg)]/30">
                  <p className="text-[var(--muted)] leading-relaxed">{item.answer}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
