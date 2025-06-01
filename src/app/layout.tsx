// app/layout.tsx
export const metadata = {
  title: "Rischis Kiosk",
  description: "Kaufen, verwalten und Guthaben einsehen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
