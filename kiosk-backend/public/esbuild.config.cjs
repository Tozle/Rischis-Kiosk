// Build-Skript für esbuild: Bündelt und minifiziert alle JS- und CSS-Dateien im public-Ordner
const esbuild = require('esbuild');
const path = require('path');

const jsFiles = [
    'admin.js',
    // 'buzzer.js',
    'dashboard.js',
    'index.js',
    'mentos.js',
    'session.js',
    'shop.js',
    'user.js',
];

// JS bündeln und minifizieren
esbuild.build({
    entryPoints: jsFiles.map(f => path.join(__dirname, f)),
    outdir: path.join(__dirname, 'dist'),
    bundle: true,
    minify: true,
    sourcemap: false,
    splitting: false,
    format: 'iife',
    target: ['es2018'],
    logLevel: 'info',
}).catch(() => process.exit(1));

// CSS wird jetzt ausschließlich von Tailwind CLI gebaut (siehe package.json build:css)
