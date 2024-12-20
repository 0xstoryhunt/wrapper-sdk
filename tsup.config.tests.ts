import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['esm'],
  entry: ['tests/src/index.test.ts', 'tests/src/ethers.test.ts'],
  outDir: './tests/dist',
  dts: false,
  minify: false,
  skipNodeModulesBundle: true,
  clean: true,
  external: ['jest'],
});
