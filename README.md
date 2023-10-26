<img width="125" src="https://github.com/Hugos68/sveltekit-capacitor/assets/63101006/3b8324ff-f27d-48a3-a74d-f7aabb2f530e" />
<img width="125" src="https://github.com/Hugos68/capkit/assets/63101006/cb12fccf-b42a-46ac-98fc-70cdf8cdf344" />
<img width="150" src="https://github.com/Hugos68/sveltekit-capacitor/assets/63101006/e748ecc6-2a2d-4dd5-95c2-4ff4cf8a307b" />

---

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
![GitHub last commit](https://img.shields.io/github/last-commit/hugos68/capkit)
![npm](https://img.shields.io/npm/v/capkit)
![npm](https://img.shields.io/npm/dt/capkit)

# CapKit

The CapKit CLI is a command-line interface that simplifies the process of configuring Capacitor with SvelteKit. With CapKit, you can quickly set up Capacitor for your SvelteKit app, making it easy to build and deploy native mobile applications as well as progressive web apps.

## Table of Contents

- [CapKit](#capkit)
  - [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
  - [Development](#development)
  - [Build](#build)
  - [API](#api)
- [Capacitor](#capacitor)
- [Examples](#examples)
- [Issues](#issues)
- [License](#license)

# Installation

Before installing CapKit, be aware that building native applications requires you to use [Adapter Static](https://kit.svelte.dev/docs/adapter-static) because of the way Capacitor works. If you are only building a progressive web app you can use any adapter you want.

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

# Usage

## Development

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
bun dev:cap
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
bun dev
```

## Build

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
bun build:cap
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
bun build
```

## API

CapKit also exposes an API to allow you to use it programmatically. This can be useful if you want to integrate CapKit into your own tooling or if you want to extend CapKit's functionality, you can use it like this:

```ts
import { initializeProject, type Options } from 'capkit';

const options: Options = {
	appName: 'My App',
	appId: 'com.myapp',
	platforms: ['android', 'ios'],
	plugins: ['clipboard', 'push-notifications'] // See a full list of plugins here: https://capacitorjs.com/docs/apis
};

initializeProject(options);
```

# Capacitor

For further questions about Capacitor you can refer to the [Capacitor Docs](https://capacitorjs.com/docs).

# Examples

Here is a example project of a SvelteKit app with Capacitor deployed to Vercel: https://capkit-vercel.vercel.app/
Repository: https://github.com/Hugos68/capkit-vercel

# Issues

If you encounter any issues or have concerns, please take a moment to [report them](https://github.com/Hugos68/capkit/issues/new). Your feedback is greatly appreciated and improves the quality of CapKit.

# License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
