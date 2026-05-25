import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type Plugin, type ResolvedConfig } from "vite";

const publicDirName = "public";
const outDirName = "dist";
const extensionAssets = [
  "manifest.json",
  "_locales/ja/messages.json",
  "_locales/en/messages.json",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png"
] as const;

function ensureExtensionAssets(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "ensure-extension-assets",
    apply: "build",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    writeBundle() {
      if (!config.publicDir) {
        throw new Error("Vite publicDir is required for Chrome extension assets.");
      }

      const publicDir = config.publicDir;
      const outDir = resolve(config.root, config.build.outDir);

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
    copyPublicDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html")
      }
    }
  }
});
