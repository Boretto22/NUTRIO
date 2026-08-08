/** Versión de `package.json`, inyectada en build por `define` (ver vite.config.ts). */
declare const __VERSION_APP__: string;

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
