import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import React, { useRef } from "react";

import FocusTrap from "./FocusTrap";

const meta: Meta<typeof FocusTrap> = {
  title: "UI/FocusTrap",
  component: FocusTrap,
  argTypes: {
    active: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof FocusTrap>;

const Template = (args: { active: boolean }) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div style={{ padding: 20 }}>
      <p>Outer page content — try tabbing into the trap when active.</p>
      <FocusTrap active={active} {...rest} initialFocusRef={btnRef} onEscape={action("onEscape")}> 
        <div role="dialog" aria-modal style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginTop: 12 }}>
          <input placeholder="First input" />
          <button ref={btnRef} style={{ marginLeft: 8 }}>Primary</button>
          <button style={{ marginLeft: 8 }} onClick={() => alert("Secondary")}>Secondary</button>
        </div>
      </FocusTrap>
    </div>
  );
};

export const Default: Story = {
  render: Template,
  args: {
    active: true,
  },
};

export const Inactive: Story = {
  render: Template,
  args: {
    active: false,
  },
};
