import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeamFlow Planner",
  description: "Shared team planning, calendar, and progress dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
