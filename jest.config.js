// Configuración de Jest independiente del .babelrc del build (que usa modules:false
// para el navegador). Aquí transpilamos a CommonJS para Node/jsdom.
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/*.test.ts?(x)'],
  // Los imports usan extensión .js (requerida por ES modules en el navegador);
  // aquí la quitamos para resolver los archivos .ts en los tests.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          [
            '@babel/preset-react',
            { pragma: 'React.createElement', pragmaFrag: 'React.Fragment' },
          ],
        ],
      },
    ],
  },
};
