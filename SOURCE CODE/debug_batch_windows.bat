npx esbuild src/server/index.js --bundle --platform=node --outfile=ehm-client.js
npx pkg --compress Brotli --config build/pkg.json --public --public-packages '*' ehm-client.js

$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"