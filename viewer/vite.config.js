// The atlas' static root also holds the single shared model and its credits.
// Stable bundle names let a rebuild replace only the generated viewer files.
export default {
  publicDir: false,
  build: {
    outDir: "../assets/atlas",
    emptyOutDir: false,
    modulePreload: { polyfill: false },
    license: { fileName: "third-party-licenses.md" },
    rolldownOptions: {
      output: {
        entryFileNames: "bundles/viewer.js",
        assetFileNames: "bundles/[name][extname]"
      }
    }
  }
};
