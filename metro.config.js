const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclure les dossiers natifs du bundling pour accélérer Metro
config.resolver.blockList = [
  /android\/.*/,
  /ios\/.*/,
  /RADIO-TEMP\/.*/
];

module.exports = config;
