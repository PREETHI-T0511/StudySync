import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudySync | Student Collaboration",
  description:
    "A calm, collaborative space to organize student teams, tasks, and meetings.",
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
