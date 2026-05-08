// Default runtime config. The deployment host (e.g. WSO2 Choreo) is expected
// to mount its own config.js over this file at the served path /config.js.
// When this default is in effect, src/config.ts falls back to the VITE_*
// env values inlined at build time — which is what local `npm run dev`
// expects.
window.configs = {};
