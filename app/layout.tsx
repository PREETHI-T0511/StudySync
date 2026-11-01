import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyCircle | Student Collaboration",
  description:
    "Coordinate student groups, project tasks, availability, and meetings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
