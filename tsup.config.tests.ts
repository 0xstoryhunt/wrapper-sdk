import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['esm'],
  entry: ['src/index.test.ts'],
  outDir: './tests/dist',
  dts: false,
  minify: false,
  skipNodeModulesBundle: true,
  clean: true,
  external: ['jest'],
})
