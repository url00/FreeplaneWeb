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

// Run esbuild
esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    format: 'esm',
    outdir: distDir,
    entryNames: '[name]-[hash]',
    metafile: true,
}).then(result => {
    // Find the output JS file from the metadata
    const meta = result.metafile.outputs;
    let jsFile = '';
    for (const key in meta) {
        if (key.endsWith('.js')) {
            jsFile = path.basename(key);
            break;
        }
    }

    if (!jsFile) {
        throw new Error("Could not find output JS file in esbuild metadata.");
    }

    // Copy and modify index.html
    let indexContent = fs.readFileSync(path.join('src', 'index.html'), 'utf8');
    // Replace the placeholder script tag
    indexContent = indexContent.replace(
        '../dist/bundle.js', // Original placeholder in src/index.html
        jsFile
    );
    fs.writeFileSync(path.join(distDir, 'index.html'), indexContent);

    console.log(`Build successful. JS bundle: ${jsFile}`);

}).catch((e) => {
    console.error("Build failed:", e);
    process.exit(1);
});
