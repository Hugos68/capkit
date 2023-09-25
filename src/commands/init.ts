import kleur from 'kleur';
import { intro, text, multiselect, confirm, cancel, outro } from '@clack/prompts';
import { promises as fs, existsSync } from 'fs';
import { asyncExec, getConfigExtension, getPM, isDirectory, executeJobs } from '../util/util.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Job, Platform, Plugin, ProjectOptions } from '../types/types.js';

export async function init() {
	console.log(`
 ██████  █████  ██████  ██   ██ ██ ████████      ██████ ██      ██
██      ██   ██ ██   ██ ██  ██  ██    ██        ██      ██      ██
██      ███████ ██████  █████   ██    ██        ██      ██      ██
██      ██   ██ ██      ██  ██  ██    ██        ██      ██      ██
 ██████ ██   ██ ██      ██   ██ ██    ██         ██████ ███████ ██                                                          
`);
	intro(`Welcome to the ${kleur.underline('capkit')} CLI!`);
	const options = await promptOptions();
	await initializeProject(options);
	outro(
		`You're all set! Happy coding!\n\n${kleur.grey(
			'If you run into any issues, please report them here: https://github.com/Hugos68/capkit/issues/new'
		)}`
	);
}

async function promptOptions() {
	const configExtension = getConfigExtension();

	if (configExtension) {
		const shouldContinue = await confirm({
			message: `Found existing Capacitor config: "${kleur.cyan(
				`capacitor.config.${configExtension}`
			)}".\nProceeding will ${kleur.underline(
				'overwrite your current configuration'
			)}. Do you want to continue?`
		});
		if (!shouldContinue) {
			cancel('Operation canceled');
			process.exit(1);
		}
	}

	const packageJsonName = JSON.parse(String(await fs.readFile('package.json')))['name'];

	const appName = (await text({
		message: `What is the ${kleur.underline('name')} of your project?`,
		placeholder: packageJsonName,
		validate: (value) => {
			if (value.length < 1) return 'Invalid name. Must be at least 1 character long.';
		}
	})) as string;

	const appId = (await text({
		message: `What is the ${kleur.underline('ID')} of your project?`,
		placeholder: `com.company.${appName}`,
		validate: (value) => {
			if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(value.toLowerCase())) {
				return `Invalid App ID "${value}". Must be in Java package form with no dashes (ex: com.example.app)`;
			}
		}
	})) as string;

	const shouldPromptPlatforms = await confirm({
		message: 'Do you want to add additional platforms?'
	});

	const allPlatforms = ['Android', 'iOS'];

	let platforms: Platform[] | null = null;
	if (shouldPromptPlatforms) {
		platforms = (await multiselect({
			message: 'What platforms do you want to add?',
			options: allPlatforms.map((platform) => {
				return {
					value: platform.toLowerCase() as Platform,
					label: platform
				};
			}),
			required: false
		})) as Platform[];
	}

	const allPlugins = [
		'Action Sheet',
		'App',
		'App Launcher',
		'Browser',
		'Camera',
		'Clipboard',
		'Device',
		'Dialog',
		'Filesystem',
		'Geolocation',
		'Google Maps',
		'Haptics',
		'Keyboard',
		'Local Notifications',
		'Motion',
		'Network',
		'Preferences',
		'Push Notifications',
		'Screen Reader',
		'Share',
		'Splash Screen',
		'Status Bar',
		'Text Zoom',
		'Toast'
	];

	const shouldPromptPlugins = await confirm({
		message: 'Do you want to add additional plugins?'
	});

	let plugins: Plugin[] | null = null;
	if (shouldPromptPlugins) {
		plugins = (await multiselect({
			message: 'What plugins do you want to add?',
			options: allPlugins.map((plugin) => {
				return {
					value: plugin.toLowerCase().replace(/ /g, '-') as Plugin,
					label: plugin
				};
			}),
			required: false
		})) as Plugin[];
	}

	const options = {
		appName,
		appId,
		platforms,
		plugins
	} as ProjectOptions;

	return options;
}

export async function initializeProject({ appName, appId, platforms, plugins }: ProjectOptions) {
	const extension = getConfigExtension();
	const packageManager = getPM();
	const jobs: Job[] = [];

	/* Configuration jobs */
	if (extension) {
		jobs.push({
			start: `Removing existing config: "${kleur.cyan(`capacitor.config.${extension}`)}"`,
			stop: `Successfully removed existing config: "${kleur.cyan(
				`capacitor.config.${extension}`
			)}"`,
			task: async () => await fs.unlink(`capacitor.config.${extension}`)
		});
	}

	jobs.push({
		start: `Creating: "${kleur.cyan('capacitor.config.json')}"`,
		stop: `Successfully created: "${kleur.cyan('capacitor.config.json')}"`,
		task: async () =>
			await fs.writeFile(
				'capacitor.config.json',
				JSON.stringify({ appId, appName, webDir: 'build' }, null, 2)
			)
	});

	jobs.push({
		start: `Configuring: "${kleur.cyan('package.json')}"`,
		stop: `Successfully configured: "${kleur.cyan('package.json')}"`,
		task: async () => {
			const packageJson = JSON.parse(String(await fs.readFile('package.json')));
			packageJson.scripts['dev:cap'] = 'node scripts/syncnetworkconfig.js && vite dev --host';
			packageJson.scripts['build:cap'] = 'vite build && npx cap sync';
			return await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
		}
	});

	if (existsSync(`${process.cwd()}/.gitignore`)) {
		const gitignore = await fs.readFile(`${process.cwd()}/.gitignore`, 'utf-8');
		if (!gitignore.includes('# Capacitor')) {
			jobs.push({
				start: `Configuring: "${kleur.cyan('.gitignore')}"`,
				stop: `Successfully configured: "${kleur.cyan('.gitignore')}"`,
				task: async () => {
					const gitignores = [
						'# Capacitor',
						'/android',
						'/ios',
						'capacitor.config.json.timestamp-*'
					];
					const gitignore = await fs.readFile(`${process.cwd()}/.gitignore`, 'utf-8');
					const newGitignore = gitignore + '\n' + gitignores.join('\n');
					return fs.writeFile('.gitignore', newGitignore, 'utf-8');
				}
			});
		}
	}

	/* Install jobs */
	jobs.push({
		start: 'Installing Capacitor',
		stop: 'Successfully installed Capacitor',
		task: async () => await asyncExec(`${packageManager} install @capacitor/cli @capacitor/core`)
	});

	if (platforms) {
		jobs.push({
			start: 'Adding additional platforms',
			stop: 'Successfully added additional platforms',
			task: async () => {
				for (let i = 0; i < platforms.length; i++) {
					const platform = platforms[i];
					await asyncExec(`${packageManager} install @capacitor/${platform}`);
					await asyncExec(`npx cap add ${platform}`);
				}
			}
		});
	}

	if (plugins) {
		jobs.push({
			start: 'Adding additional plugins',
			stop: 'Successfully added additional plugins',
			task: async () => {
				let installCommand = `${packageManager} install`;
				for (let i = 0; i < plugins.length; i++) {
					const platform = plugins[i];
					installCommand += ` @capacitor/${platform}`;
				}
				return await asyncExec(installCommand);
			}
		});
	}

	jobs.push({
		start: 'Installing custom scripts',
		stop: 'Successfully installed custom scripts',
		task: async () => {
			const packageDir = path.dirname(fileURLToPath(import.meta.url));
			const consumerDir = process.cwd();

			if (!existsSync(`${consumerDir}/scripts`) || !isDirectory(`${consumerDir}/scripts`)) {
				await fs.mkdir(`${consumerDir}/scripts`);
			}

			return fs.copyFile(
				`${packageDir}/scripts/syncnetworkconfig.js`,
				`${consumerDir}/scripts/syncnetworkconfig.js`
			);
		}
	});

	await executeJobs(jobs);
}
