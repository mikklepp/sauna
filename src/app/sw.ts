import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Google Fonts
    {
      matcher({ url }) {
        return url.origin === 'https://fonts.gstatic.com';
      },
      handler: new CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          }),
        ],
      }),
    },
    {
      matcher({ url }) {
        return url.origin === 'https://fonts.googleapis.com';
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          }),
        ],
      }),
    },
    // Font files
    {
      matcher({ url }) {
        return /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i.test(
          url.pathname
        );
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          }),
        ],
      }),
    },
    // Images
    {
      matcher({ url }) {
        return /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i.test(url.pathname);
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    {
      matcher({ url }) {
        return url.pathname.startsWith('/_next/image');
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    // Audio files
    {
      matcher({ url }) {
        return /\.(?:mp3|wav|ogg)$/i.test(url.pathname);
      },
      handler: new CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    // Video files
    {
      matcher({ url }) {
        return /\.(?:mp4)$/i.test(url.pathname);
      },
      handler: new CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    // JavaScript and CSS
    {
      matcher({ url }) {
        return /\.(?:js)$/i.test(url.pathname);
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    {
      matcher({ url }) {
        return /\.(?:css|less)$/i.test(url.pathname);
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    // Next.js data
    {
      matcher({ url }) {
        return (
          url.pathname.startsWith('/_next/data/') &&
          url.pathname.endsWith('.json')
        );
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    // API routes with NetworkFirst strategy
    {
      matcher({ url }) {
        return url.pathname.startsWith('/api/');
      },
      handler: new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 60 * 5, // 5 minutes
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
