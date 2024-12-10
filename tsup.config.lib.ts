import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['src/index.ts'],
  outDir: './dist',
  minify: true,
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
});
