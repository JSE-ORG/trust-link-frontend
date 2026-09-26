"use client";

import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

interface AccordionItem {
  question: string;
  answer: string;
  /** Optional icon rendered before the question text. */
  icon?: React.ReactNode;
  /** When true, this item cannot be expanded/collapsed and is visually muted. */
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    if (items[index]?.disabled) return;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index && !item.disabled;
        return (
          <div
            key={index}
            className={cn(
              "rounded-xl border border-zinc-200 dark:border-zinc-800",
              item.disabled && "opacity-50"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              disabled={item.disabled}
              aria-expanded={isOpen}
              aria-disabled={item.disabled || undefined}
              className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-300 rounded-xl disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                {item.icon ? (
                  <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.question}</span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-zinc-600 dark:text-zinc-400">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}