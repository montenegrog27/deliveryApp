// import "../styles/globals.css";
// import { CartProvider } from "@/context/CartContext";
// import Script from "next/script";
// import { Inter } from "next/font/google";

// const inter = Inter({
//   subsets: ["latin"],
//   weight: ["400", "600", "700", "800"],
// });

// export const metadata = {
//   title: "Mordisco",
//   description: "Hamburguesería",
// };

// export const viewport = {
//   width: "device-width",
//   initialScale: 1,
//   maximumScale: 1,
//   userScalable: "no",
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="es">
//       <head>
//         {/* Noscript fallback del Pixel */}
//         {process.env.NODE_ENV === "production" && (
//           <noscript>
//             <img
//               height="1"
//               width="1"
//               style={{ display: "none" }}
//               src="https://www.facebook.com/tr?id=1438935144041565&ev=PageView&noscript=1"
//             />
//           </noscript>
//         )}
//         <Script
//           src={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`}
//           strategy="beforeInteractive"
//         />
//       </head>
//       <body className={inter.className}>
//         {/* Scripts de seguimiento solo en producción */}
//         {process.env.NODE_ENV === "production" && (
//           <>
//             {/* Meta Pixel */}
//             <Script
//               id="facebook-pixel"
//               strategy="afterInteractive"
//               dangerouslySetInnerHTML={{
//                 __html: `
//                   !function(f,b,e,v,n,t,s)
//                   {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
//                   n.callMethod.apply(n,arguments):n.queue.push(arguments)};
//                   if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
//                   n.queue=[];t=b.createElement(e);t.async=!0;
//                   t.src=v;s=b.getElementsByTagName(e)[0];
//                   s.parentNode.insertBefore(t,s)}(window, document,'script',
//                   'https://connect.facebook.net/en_US/fbevents.js');
//                   fbq('init', '1438935144041565'); 
//                   fbq('track', 'PageView');
//                 `,
//               }}
//             />

//             {/* Google Analytics */}
//             <Script
//               async
//               src="https://www.googletagmanager.com/gtag/js?id=G-JM55Z6FN4D"
//             />
//             <Script id="google-analytics" strategy="afterInteractive">
//               {`
//                 window.dataLayer = window.dataLayer || [];
//                 function gtag(){dataLayer.push(arguments);}
//                 gtag('js', new Date());
//                 gtag('config', 'G-JM55Z6FN4D');
//               `}
//             </Script>
//           </>
//         )}

//         <CartProvider>{children}</CartProvider>
//       </body>
//     </html>
//   );
// }



import "../styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import Script from "next/script";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata = {
  title: "Mordisco",
  description: "Hamburguesería",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Google Maps */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />

        {/* Google Tag Manager (script) */}
        {process.env.NODE_ENV === "production" && (
          <Script id="gtm-head" strategy="beforeInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WG2WV8CF');
            `}
          </Script>
        )}
      </head>

      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        {process.env.NODE_ENV === "production" && (
          <>
            <noscript>
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-WG2WV8CF"
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              ></iframe>
            </noscript>

            {/* Meta Pixel (noscript) */}
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src="https://www.facebook.com/tr?id=1438935144041565&ev=PageView&noscript=1"
              />
            </noscript>
          </>
        )}

        {/* Scripts de seguimiento solo en producción */}
        {process.env.NODE_ENV === "production" && (
          <>
            {/* Meta Pixel */}
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

            {/* Google Analytics */}
            <Script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-JM55Z6FN4D"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-JM55Z6FN4D');
              `}
            </Script>
          </>
        )}

        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
