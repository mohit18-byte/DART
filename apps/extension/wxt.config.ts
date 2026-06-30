import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Dart — AI Browser Agent',
    description:
      'Your personal AI assistant that controls your real browser. Give natural language commands and watch Dart execute them step by step.',
    version: '0.1.0',
    // Pre-generated public key for stable CRX ID (needed for Clerk OAuth + native messaging)
    // Generate with: openssl rand -hex 32 | xxd -r -p | base64
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xfn/ygWyF068WMFEIkMBP/MZLXLKP4VEt1EbGFOmkD2+FRhKRSEFpmGJBA8F0m2+sMn9obQVagXPQgDoKWGMPBCkjXqbHNxGINHSb1KG4DjJXXr4L5kfY5aD0iFheHBzX5VQ8LGZkn5ceJWSand3FVhg5LIEn9BSP8kRG+pUOQCyEGxFOjaVfZp6BQPY0CEBXsYrfcG3abMi29sGvtthj4bGhPVdBi+hT7QHhGdVWcJMhJ/P/H+jFfzKN8LEgaP5Q4z9VKhpLPuYJJq6fNQFDaDyQ3dFgQILABM7xGSJBGNlEMwSJjn8C5D5hL1bV3nl5VQIDAQAB',
    permissions: [
      'sidePanel',
      'activeTab',
      'scripting',
      'storage',
      'tabs',
      'nativeMessaging',
    ],
    host_permissions: [],
  },
  runner: {
    startUrls: ['https://google.com'],
  },
});
