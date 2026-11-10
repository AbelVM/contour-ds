import "contour-ds/contour.min.css";

export const metadata = {
  title: "Contour · Next consumer",
  description: "A minimal Next.js app wired to the installed Contour package.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}