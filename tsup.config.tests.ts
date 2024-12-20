import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['esm'],
  entry: ['tests/src'],
  outDir: './tests/dist',
  dts: false,
  minify: false,
  skipNodeModulesBundle: true,
  clean: true,
  external: ['jest'],
});
