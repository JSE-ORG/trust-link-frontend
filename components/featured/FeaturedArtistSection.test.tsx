import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FeaturedArtistSection from "./FeaturedArtistSection";

describe("FeaturedArtistSection", () => {
  it("renders the section heading and description", () => {
    render(<FeaturedArtistSection />);

    expect(
      screen.getByRole("heading", { name: /featured artists/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /top-rated vendors trusted by our community for secure transactions/i
      )
    ).toBeInTheDocument();
  });

  it('renders a "View All Artists" link pointing to /vendor', () => {
    render(<FeaturedArtistSection />);

    const viewAllLink = screen.getByRole("link", { name: /view all artists/i });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute("href", "/vendor");
  });

  it("renders a card for every featured artist with correct details and links", () => {
    render(<FeaturedArtistSection />);

    const expectedArtists = [
      {
        name: "Premium Electronics Co.",
        address: "GBAM5V6X2J7E3...K4L9M2N8P1",
        category: "Electronics",
        rating: "4.8",
        reviewsCount: "(124)",
        verificationLevel: "Gold Verified",
        location: "New York, USA",
        totalTransactions: "342",
      },
      {
        name: "Artisan Crafts Studio",
        address: "GCXQ3R8T9Y5A...B7K2M4N6P3",
        category: "Handmade Crafts",
        rating: "4.9",
        reviewsCount: "(89)",
        verificationLevel: "Gold Verified",
        location: "Berlin, Germany",
        totalTransactions: "215",
      },
      {
        name: "Digital Assets Hub",
        address: "GAW7K2X4M6N9...P1R3T5V8Y2",
        category: "Digital Goods",
        rating: "4.7",
        reviewsCount: "(203)",
        verificationLevel: "Silver Verified",
        location: "Tokyo, Japan",
        totalTransactions: "567",
      },
      {
        name: "Luxury Timepieces",
        address: "GD8K1M4N7P2...R5T8V1X4Y7",
        category: "Luxury Goods",
        rating: "4.6",
        reviewsCount: "(67)",
        verificationLevel: "Gold Verified",
        location: "Zurich, Switzerland",
        totalTransactions: "178",
      },
    ];

    for (const artist of expectedArtists) {
      const heading = screen.getByRole("heading", { name: artist.name });
      const card = heading.closest("a");
      expect(card).not.toBeNull();
      expect(card).toHaveAttribute("href", `/vendor/${artist.address}`);

      const utils = within(card as HTMLElement);
      expect(utils.getByText(artist.category)).toBeInTheDocument();
      expect(utils.getByText(artist.rating)).toBeInTheDocument();
      expect(utils.getByText(artist.reviewsCount)).toBeInTheDocument();
      expect(utils.getByText(artist.verificationLevel)).toBeInTheDocument();
      expect(utils.getByText(artist.location)).toBeInTheDocument();
      expect(utils.getByText(artist.totalTransactions)).toBeInTheDocument();
    }
  });

  it("renders exactly four artist cards", () => {
    render(<FeaturedArtistSection />);

    const heading = screen.getByRole("heading", { name: /featured artists/i });
    const section = heading.closest("section");
    expect(section).not.toBeNull();

    const cards = within(section as HTMLElement).getAllByRole("link", {
      name: /transactions/i,
    });
    expect(cards).toHaveLength(4);
  });

  it("renders an avatar image for each artist with accessible alt text", () => {
    render(<FeaturedArtistSection />);

    expect(
      screen.getByAltText("Premium Electronics Co. avatar")
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("Artisan Crafts Studio avatar")
    ).toBeInTheDocument();
    expect(screen.getByAltText("Digital Assets Hub avatar")).toBeInTheDocument();
    expect(screen.getByAltText("Luxury Timepieces avatar")).toBeInTheDocument();
  });

  it("marks the first artist's image as priority/eager for LCP", () => {
    render(<FeaturedArtistSection />);

    const firstImage = screen.getByAltText("Premium Electronics Co. avatar");
    expect(firstImage).toHaveAttribute("loading", "eager");

    const secondImage = screen.getByAltText("Artisan Crafts Studio avatar");
    expect(secondImage).toHaveAttribute("loading", "lazy");
  });
});
