const fs = require('fs');
const path = require('path');
const packageJSON = require('./package.json');
const version = JSON.stringify(packageJSON.version).replaceAll('"', '');

const versionPlaceholder = '__VERSION__';
const newVersion = version || '1.0.0';

const sourceFilePath = path.join(__dirname, 'dist/mobile-handler.min.mjs');
let sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');

sourceCode = sourceCode.replaceAll(versionPlaceholder, newVersion);

fs.writeFileSync(sourceFilePath, sourceCode, 'utf-8');
