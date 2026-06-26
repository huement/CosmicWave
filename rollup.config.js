import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const components = ['cosmicwave', 'cosmicpoly'];

// 2. The JavaScript Build Configurations
const jsConfigs = components.map((name) => ({
  input: `src/${name}.js`,
  output: [
    {
      file: `dist/${name}.js`,
      format: 'umd',
      name: name,
    },
    {
      file: `dist/${name}.min.js`,
      format: 'umd',
      name: name,
      plugins: [terser()],
    }
  ],
}));

// 3. The Type Definitions (.d.ts) Build Configurations
const typeConfigs = components.map((name) => ({
  input: `./dist/types-temp/${name}.d.ts`,
  output: [
    {
      file: `dist/${name}.d.ts`,
      format: 'es',
    },
  ],
  plugins: [dts()],
}));

// 4. Flatten and Export Both Maps Together for Rollup
export default [...jsConfigs, ...typeConfigs];
