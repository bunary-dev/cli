{
  "name": "{{name}}",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "start": "bun run src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist --target bun"
  },
  "dependencies": {
    "@bunary/core": "^0.0.7",
    "@bunary/http": "^0.0.11"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.9.3"
  }
}
