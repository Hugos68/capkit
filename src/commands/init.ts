import kleur from 'kleur';
import { intro, text, multiselect, confirm, cancel, outro } from '@clack/prompts';
import { promises as fs, existsSync } from 'fs';
import { asyncExec, getConfigExtension, getPM, isDirectory, executeJobs } from '../util/util.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Job, ProjectOptions } from '../types/types.js';

export async function init() {
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

	const name = (await text({
		message: `What is the ${kleur.underline('name')} of your project?`,
		placeholder: packageJsonName
	})) as string;

	const id = await text({
		message: `What is the ${kleur.underline('ID')} of your project?`,
		placeholder: `com.company.${name}`,
		validate: (value) => {
			if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(value.toLowerCase())) {
				return `Invalid App ID "${value}". Must be in Java package form with no dashes (ex: com.example.app)`;
			}
		}
	});

	const shouldPromptPlatforms = await confirm({
		message: 'Do you want to add additional platforms?'
	});

	let selectedPlatforms: string[] | null = null;
	if (shouldPromptPlatforms) {
		const platforms = ['Android', 'iOS'];
		selectedPlatforms = (await multiselect({
			message: 'What platforms do you want to add? (Optional)',
			options: platforms.map((platform) => {
				return {
					value: platform.toLowerCase(),
					label: platform
				};
			}),
			required: false
		})) as string[];
	}

	const plugins = [
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

	let selectedPlugins: string[] | null = null;
	if (shouldPromptPlugins) {
		selectedPlugins = (await multiselect({
			message: 'What plugins do you want to add? (Optional)',
			options: plugins.map((plugin) => {
				return {
					value: plugin.toLowerCase().replace(/ /g, '-'),
					label: plugin
				};
			}),
			required: false
		})) as string[];
	}

	const pm = getPM();

	const options = {
		name,
		id,
		selectedPlatforms,
		selectedPlugins,
		configExtension,
		pm
	} as ProjectOptions;

	return options;
}

async function initializeProject({
	name: appName,
	id: appId,
	selectedPlatforms,
	configExtension,
	selectedPlugins,
	pm
}: ProjectOptions) {
	const jobs: Job[] = [];

	jobs.push({
		start: `Configuring: "${kleur.cyan('package.json')}"`,
		stop: `Successfully configured: "${kleur.cyan('package.json')}"`,
		task: async () => {
			const packageJson = JSON.parse(String(await fs.readFile('package.json')));
			packageJson.scripts['dev:cap'] =
				'node ./scripts/hotreload.js && npx cap sync && node ./scripts/hotreload-cleanup.js && npm run build';
			packageJson.scripts['build:cap'] = 'vite build && npx cap sync';
			return await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
		}
	});

	jobs.push({
		start: 'Installing Capacitor',
		stop: 'Successfully installed Capacitor',
		task: async () => await asyncExec(`${pm} install @capacitor/cli @capacitor/core`)
	});

	if (configExtension) {
		jobs.push({
			start: `Removing existing config: "${kleur.cyan(`capacitor.config.${configExtension}`)}"`,
			stop: `Successfully removed existing config: "${kleur.cyan(
				`capacitor.config.${configExtension}`
			)}"`,
			task: async () => await fs.unlink(`capacitor.config.${configExtension}`)
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

	if (selectedPlatforms) {
		jobs.push({
			start: 'Adding additional platforms',
			stop: 'Successfully added additional platforms',
			task: async () => {
				for (let i = 0; i < selectedPlatforms.length; i++) {
					const platform = selectedPlatforms[i];
					await asyncExec(`${pm} install @capacitor/${platform}`);
					await asyncExec(`npx cap add ${platform}`);
				}
			}
		});
	}

	if (selectedPlugins) {
		jobs.push({
			start: 'Adding additional plugins',
			stop: 'Successfully added additional plugins',
			task: async () => {
				let installCommand = `${pm} install`;
				for (let i = 0; i < selectedPlugins.length; i++) {
					const platform = selectedPlugins[i];
					installCommand += ` @capacitor/${platform}`;
				}
				return await asyncExec(installCommand);
			}
		});
	}

	jobs.push({
		start: 'Importing custom scripts',
		stop: 'Successfully imported custom scripts',
		task: async () => {
			const packageDir = path.dirname(fileURLToPath(import.meta.url));
			const consumerDir = process.cwd();

			if (!existsSync(`${consumerDir}/scripts`) || !isDirectory(`${consumerDir}/scripts`)) {
				await fs.mkdir(`${consumerDir}/scripts`);
			}

			await fs.copyFile(
				`${packageDir}/../scripts/hotreload.js`,
				`${consumerDir}/scripts/hotreload.js`
			);

			return fs.copyFile(
				`${packageDir}/../scripts/hotreload-cleanup.js`,
				`${consumerDir}/scripts/hotreload-cleanup.js`
			);
		}
	});

	if (existsSync(`${process.cwd()}/.gitignore`)) {
		jobs.push({
			start: `Configuring: "${kleur.cyan('.gitignore')}"`,
			stop: `Successfully configured: "${kleur.cyan('.gitignore')}"`,
			task: async () => {
				const gitignores = ['# Capacitor', '/android', '/ios', 'capacitor.config.json.timestamp-*'];
				const gitignore = await fs.readFile(`${process.cwd()}/.gitignore`, 'utf-8');
				const newGitignore = gitignore + '\n' + gitignores.join('\n');
				return fs.writeFile('.gitignore', newGitignore, 'utf-8');
			}
		});
	}

	await executeJobs(jobs);
}