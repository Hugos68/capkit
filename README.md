<img width="125px" src="https://github.com/Hugos68/sveltekit-capacitor/assets/63101006/3b8324ff-f27d-48a3-a74d-f7aabb2f530e" />
<img width="150" src="https://github.com/Hugos68/sveltekit-capacitor/assets/63101006/e748ecc6-2a2d-4dd5-95c2-4ff4cf8a307b" />

---

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
![GitHub last commit](https://img.shields.io/github/last-commit/hugos68/capkit)
![npm](https://img.shields.io/npm/v/capkit)
![npm](https://img.shields.io/npm/dt/capkit)

# CapKit

The CapKit CLI is a command-line interface that simplifies the process of configuring Capacitor with SvelteKit. With CapKit, you can quickly set up Capacitor for your SvelteKit app, making it easy to build and deploy native mobile applications as well as progressive web apps.

## Installation

Before starting be aware that Capacitor will only work with [Adapter Static](https://kit.svelte.dev/docs/adapter-static), be sure you have this configured correctly.

To get started with the CLI you can simply go into your existing sveltekit project and run:

npm:
```bash
npx capkit init
```
pnpm:
```bash
pnpm dlx capkit init
```
yarn:
```bash
yarn dlx capkit init
```
bun:
```bash
bunx capkit init
```

Upon doing this, you will be guided through a series of questions to help you configure your project optimally. These questions will allow you to tailor the setup to your specific requirements.

---

## Usage

### Development

When working with native applications and using their respective IDE's (Android Studio or Xcode) you can enable hot reloading by running:

npm:
```bash
npm run dev:cap
```
pnpm:
```bash
pnpm dev:cap
```
yarn:
```bash
yarn dev:cap
```
bun:
```bash
bunx dev:cap
```

If you are solely focusing on creating a progressive web app you can run:

npm:
```bash
npm run dev
```
pnpm:
```bash
pnpm dev
```
yarn:
```bash
yarn dev
```
bun:
```bash
bunx dev
```

### Build

When building to native platforms you can use:

npm:
```bash
npm run build:cap
```
pnpm:
```bash
pnpm build:cap
```
yarn:
```bash
yarn build:cap
```
bun:
```bash
bunx build:cap
```

If you are solely focusing on building a progressive web app you can run:

npm:
```bash
npm run build
```
pnpm:
```bash
pnpm build
```
yarn:
```bash
yarn build
```
bun:
```bash
bunx build
```
---

## Capacitor

For further questions about Capacitor you can refer to the [Capacitor Docs](https://capacitorjs.com/docs).

---

## Issues

If you encounter any issues or have concerns, please take a moment to [report them](https://github.com/Hugos68/capkit/issues/new). Your feedback is greatly appreciated and improves the quality of CapKit.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
