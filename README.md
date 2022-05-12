`ln -s ~/work/rust/chip8 ~/work/rust/chip8-rust-wasm-frontend/wasm-lib`
`npm install ./wasm-lib/pkg`

for development, in package.json `"rust-wasm-chip8": "file:wasm-lib/pkg",`

`npm run build:wasm`

Deployed on http://chip8-rust-wasm-frontend.apps.loskutoff.com