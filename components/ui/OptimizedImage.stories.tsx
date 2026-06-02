import type { Meta, StoryObj } from "@storybook/react";
import OptimizedImage from "./OptimizedImage";

const meta: Meta<typeof OptimizedImage> = {
  title: "UI/OptimizedImage",
  component: OptimizedImage,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof OptimizedImage>;

export const Default: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
    alt: "Product image",
    width: 600,
    height: 400,
  },
};

export const WithCustomBlur: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
    alt: "Product with custom blur",
    width: 600,
    height: 400,
    customBlurDataURL: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23e4e4e7' width='400' height='300'/%3E%3C/svg%3E",
  },
};

export const NoBlur: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
    alt: "Product without blur",
    width: 600,
    height: 400,
    useBlur: false,
  },
};

export const Thumbnail: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop",
    alt: "Thumbnail image",
    width: 150,
    height: 150,
    className: "rounded-lg",
  },
};

export const EagerLoading: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
    alt: "Eager loaded image",
    width: 600,
    height: 400,
    loading: "eager",
  },
};
