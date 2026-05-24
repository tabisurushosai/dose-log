import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const publicDirName = "public";
const outDirName = "dist";
const publicDir = resolve(__dirname, publicDirName);
const outDir = resolve(__dirname, outDirName);
const extensionAssets = [
  "manifest.json",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png"
] as const;

function ensureExtensionAssets(): Plugin {
  return {
    name: "ensure-extension-assets",
    apply: "build",
    closeBundle() {
      for (const asset of extensionAssets) {
        const source = resolve(publicDir, asset);
        if (!existsSync(source)) {
          throw new Error(`Missing Chrome extension asset: ${source}`);
        }

        const destination = resolve(outDir, asset);
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(source, destination);
      }
    }
  };
}

export default defineConfig({
  publicDir: publicDirName,
  plugins: [ensureExtensionAssets()],
  build: {
    outDir: outDirName,
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html")
      }
    }
  }
});
