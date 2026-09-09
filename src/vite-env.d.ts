/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the deployed Timeline News worker. See workers/news/README.md. */
  readonly VITE_NEWS_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
