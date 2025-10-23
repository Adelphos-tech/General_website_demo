#!/usr/bin/env node
// Ensure GitHub Pages serves the Vite build without running Jekyll.
const fs = require('fs');
const path = require('path');

const docsDir = path.resolve(__dirname, '..', 'docs');
const noJekyllPath = path.join(docsDir, '.nojekyll');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

fs.writeFileSync(noJekyllPath, '');
