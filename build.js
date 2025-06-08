const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const distDir = 'dist';

// Clean dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy static files
fs.copyFileSync(path.join('src', 'style.css'), path.join(distDir, 'style.css'));

// Copy and modify index.html
let indexContent = fs.readFileSync(path.join('src', 'index.html'), 'utf8');
indexContent = indexContent.replace('../dist/bundle.js', 'bundle.js');
fs.writeFileSync(path.join(distDir, 'index.html'), indexContent);

// Run esbuild
esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'esm',
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
