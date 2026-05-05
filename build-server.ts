import * as esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: 'dist/server.cjs',
    format: 'cjs',
    external: [
      'fsevents',
      'pdf-parse',
      'mammoth',
      'multer',
      'express',
      'vite',
      'firebase-admin',
      'dotenv'
    ], // Keep external deps that node will handle
  });
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
