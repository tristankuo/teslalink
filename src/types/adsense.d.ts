// Google AdSense and Analytics TypeScript declarations
declare global {
  interface Window {
    adsbygoogle: any[];
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export {};