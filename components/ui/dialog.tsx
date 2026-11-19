"use client";

import { X } from "lucide-react";
import * as React from "react";
import { useEffect, useId, useState } from "react";

import FocusTrap from "./FocusTrap";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  hasTitle: boolean;
  setHasTitle: React.Dispatch<React.SetStateAction<boolean>>;
  hasDescription: boolean;
  setHasDescription: React.Dispatch<React.SetStateAction<boolean>>;
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
  titleId: "",
  descriptionId: "",
  hasTitle: false,
  setHasTitle: () => {},
  hasDescription: false,
  setHasDescription: () => {},
});

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const generatedId = useId();
  const titleId = `dialog-title-${generatedId}`;
  const descriptionId = `dialog-description-${generatedId}`;
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);

  return (
    <DialogContext.Provider
      value={{
        open,
        onOpenChange,
        titleId,
        descriptionId,
        hasTitle,
        setHasTitle,
        hasDescription,
        setHasDescription,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { onOpenChange } = React.useContext(DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      "aria-haspopup": "dialog",
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        // @ts-expect-error - we know it might have onClick
        if (children.props.onClick) children.props.onClick(e);
        onOpenChange(true);
      },
    } as Record<string, unknown>);
  }
  return (
    <button type="button" aria-haspopup="dialog" onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export function DialogContent({
  children,
  className = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DialogContentProps) {
  const {
    open,
    onOpenChange,
    titleId,
    descriptionId,
    hasTitle,
    hasDescription,
  } = React.useContext(DialogContext);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const resolvedLabelledBy =
    ariaLabelledBy || (!ariaLabel && hasTitle ? titleId : undefined);
  const resolvedDescribedBy =
    ariaDescribedBy || (hasDescription ? descriptionId : undefined);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => onOpenChange(false)}
    >
      <FocusTrap active={open} onEscape={() => onOpenChange(false)}>
        <div
          className={`relative z-50 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={resolvedLabelledBy}
          aria-describedby={resolvedDescribedBy}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 transition-opacity hover:bg-zinc-100 hover:opacity-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          {children}
        </div>
      </FocusTrap>
    </div>
  );
}

export function DialogHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { titleId, setHasTitle } = React.useContext(DialogContext);

  useEffect(() => {
    setHasTitle(true);
    return () => setHasTitle(false);
  }, [setHasTitle]);

  return (
    <h2
      id={id ?? titleId}
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { descriptionId, setHasDescription } = React.useContext(DialogContext);

  useEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);

  return (
    <p
      id={id ?? descriptionId}
      className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      {children}
    </p>
  );
}
