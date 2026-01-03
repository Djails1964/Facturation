// babel.config.js
// Configuration Babel pour Jest - À placer à la racine de facturation/

module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' }
    }],
    ['@babel/preset-react', { 
      runtime: 'automatic' 
    }]
  ],
  plugins: [
    ['module-resolver', {
      root: ['./'],
      alias: {
        '@': './src',
        '@components': './src/components',
        '@services': './src/services',
        '@hooks': './src/hooks',
        '@utils': './src/utils',
        '@constants': './src/constants'
      }
    }]
  ]
};