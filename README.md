<img width="175px" src="https://github.com/Hugos68/sveltekit-capacitor/assets/63101006/3b8324ff-f27d-48a3-a74d-f7aabb2f530e" />
<img width="200px" src="https://github.com/Hugos68/sveltekit-capacitor/assets/63101006/e748ecc6-2a2d-4dd5-95c2-4ff4cf8a307b" />

# CapKit

The CapKit CLI is a command-line tool that simplifies the process of configuring Capacitor with SvelteKit. With CapKit, you can quickly set up Capacitor for your SvelteKit app, making it easy to build and deploy native mobile applications as well as progressive web apps.

## Installation

To get started with the CLI you can simply go into your existing sveltekit project and run:

```bash
npx capkit init
```
Upon doing this, you will be guided through a series of questions to help you configure your project optimally. These questions will allow you to tailor the setup to your specific requirements.

## Usage

To help improve the integration more the capkit CLI adds two scripts to your package.json.

### Development

When working with native applications and using their respective IDE's (Android Studio or Xcode) you can enable hot reloading by running:

```bash
npm run dev:cap
```

If you are solely focusing on creating a progressive web app you can run:

```bash
npm run dev
```

### Build

When building to native platforms you can use:

```bash
npm run build:cap
```

If you are solely focusing on building a progressive web app you can run:

```bash
npm run build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
