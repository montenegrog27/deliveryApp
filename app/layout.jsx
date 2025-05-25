// // app/layout.tsx o pages/_app.tsx
// import "../styles/globals.css";
// import { CartProvider } from "@/context/CartContext";

// import { Inter } from "next/font/google";

// const inter = Inter({
//   subsets: ["latin"],
//   weight: ["400", "600", "700", "800"],
// });
// export const metadata = {
//   title: "Hamburguesería",
//   description: "El mejor lugar para tus burgers 🍔",
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="es">
//       <body className={inter.className}>
//         <CartProvider>{children}</CartProvider>{" "}
//       </body>
//     </html>
//   );
// }

// app/layout.tsx
import "../styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import Script from "next/script";
import Head from "next/head";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata = {
  title: "Mordisco",
  description: "Hamburgueseria",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        {/* Noscript para navegadores sin JS */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1438935144041565&ev=PageView&noscript=1"
          />
        </noscript>
      </Head>
      <body className={inter.className}>
        {/* Pixel de Meta: script en cliente */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1438935144041565'); 
              fbq('track', 'PageView');
            `,
          }}
        />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
