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
    "@bunary/core": "^0.0.5",
    "@bunary/http": "^0.0.4"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.3"
  }
}
