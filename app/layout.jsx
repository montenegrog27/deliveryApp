// app/layout.tsx o pages/_app.tsx
import "../styles/globals.css";

import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});
export const metadata = {
  title: "Hamburguesería",
  description: "El mejor lugar para tus burgers 🍔",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
