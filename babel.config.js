module.exports = (babel) => {
  babel.cache(true);
  return {
    presets: [
      "@babel/preset-react",
      '@babel/preset-env',
      "@babel/preset-typescript"
    ]
  }
};