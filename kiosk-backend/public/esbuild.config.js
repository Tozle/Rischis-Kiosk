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

const cssFiles = [
    'style.css',
    'components.css',
    'buttons.css',
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

// CSS bündeln und minifizieren
esbuild.build({
    entryPoints: cssFiles.map(f => path.join(__dirname, f)),
    outdir: path.join(__dirname, 'dist'),
    bundle: true,
    minify: true,
    sourcemap: false,
    logLevel: 'info',
    loader: { '.css': 'css' },
}).catch(() => process.exit(1));
