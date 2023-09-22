#!/usr/bin/env node
import { Command } from 'commander';
import { intro, text, multiselect, confirm, cancel, outro, spinner } from '@clack/prompts';
import { promises as fs, existsSync } from 'fs';
import { asyncExec, getConfigExtension, whichPMRuns } from './util.js';

const program = new Command();

program.version('0.0.1');

program
	.command('initialize')
	.alias('init')
	.description('Initialize capkit')
	.action(async () => {
		intro('Welcome to the capkit CLI!');
		const options = await promptOptions();
		await initializeProject(options);
		outro(
			`You're all set! Happy coding!\n\nIf you run into any issues please report them here: https://github.com/Hugos68/capkit/issues/new`
		);
	});
program.parse(process.argv);

async function promptOptions() {
	const configExtension = getConfigExtension();

	if (configExtension) {
		const shouldContinue = await confirm({
			message: `Found existing Capacitor config: "\x1b[1mcapacitor.config.${configExtension}\x1b[0m". Proceeding will \x1b[4moverwrite your current configuration\x1b[0m. Do you want to continue?`
		});
		if (!shouldContinue) {
			cancel('Operation canceled');
			process.exit(1);
		}
	}

	const packageJsonName = JSON.parse(await fs.readFile('package.json'))['name'];

	const name = await text({
		message: 'What is the name of your project?',
		placeholder: packageJsonName,
		required: true
	});

	const id = await text({
		message: 'What is the ID of your project?',
		placeholder: `com.company.${name}`,
		validate: (value) =>
			/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(value.toLowerCase())
				? null
				: `Invalid App ID "${value}". Must be in Java package form with no dashes (ex: com.example.app)`,
		required: true
	});

	const shouldPromptPlatforms = await confirm({
		message: 'Do you want to add additional platforms?'
	});

	let selectedPlatforms;
	if (shouldPromptPlatforms) {
		const platforms = ['Android', 'iOS'];
		selectedPlatforms = await multiselect({
			message: 'What platforms do you want to add? (Optional)',
			options: platforms.map((platform) => {
				return {
					value: platform.toLowerCase(),
					label: platform
				};
			}),
			required: false
		});
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

	let selectedPlugins;
	if (shouldPromptPlugins) {
		selectedPlugins = await multiselect({
			message: 'What plugins do you want to add? (Optional)',
			options: plugins.map((plugin) => {
				return {
					value: plugin.toLowerCase().replace(/ /g, '-'),
					label: plugin
				};
			}),
			required: false
		});
	}

	const pm = whichPMRuns().name;

	return {
		name,
		id,
		selectedPlatforms,
		selectedPlugins,
		configExtension,
		pm
	};
}

async function initializeProject({
	name: appName,
	id: appId,
	selectedPlatforms,
	configExtension,
	selectedPlugins,
	pm
}) {
	const jobs = [];

	jobs.push({
		start: 'Configuring: "\x1b[1mpackage.json\x1b[0m"',
		stop: 'Successfully configured: "\x1b[1mpackage.json\x1b[0m"',
		task: async () => {
			const packageJson = JSON.parse(await fs.readFile('package.json'));
			packageJson.scripts['dev:cap'] =
				'node ./scripts/hotreload.js && npx cap sync && node ./scripts/hotreload-cleanup.js && npm run build';
			packageJson.scripts['build:cap'] = 'vite build && npx cap sync';
			return fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
		}
	});

	jobs.push({
		start: 'Installing: "\x1b[1mCapacitor\x1b[0m"',
		stop: 'Successfully installed: "\x1b[1mCapacitor\x1b[0m"',
		task: async () => {
			await asyncExec(`${pm} install @capacitor/cli`);
			return asyncExec(`${pm} install @capacitor/core`);
		}
	});

	if (selectedPlatforms) {
		jobs.push({
			start: 'Adding additional platforms.',
			stop: 'Successfully added additional platforms.',
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
			start: 'Adding additional plugins.',
			stop: 'Successfully added additional plugins.',
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

	if (configExtension) {
		jobs.push({
			start: `Removing existing config: "\x1b[1mcapacitor.config.${configExtension}\x1b[0m"`,
			stop: `Successfully removed existing config: "\x1b[1mcapacitor.config.${configExtension}\x1b[0m"`,
			task: async () => fs.unlink(`capacitor.config.${configExtension}`)
		});
	}

	jobs.push({
		start: 'Creating: "\x1b[1mcapacitor.config.json\x1b[0m"',
		stop: 'Successfully created: "\x1b[1mcapacitor.config.json\x1b[0m"',
		task: async () =>
			fs.writeFile(
				'capacitor.config.json',
				JSON.stringify({ appId, appName, webDir: 'build' }, null, 2)
			)
	});

	jobs.push({
		start: 'Copying hotreload scripts',
		stop: 'Successfully copied hotreload scripts',
		task: async () => {
			const root = process.cwd() + '/';
			if (existsSync(`${root}/scripts`)) await fs.mkdir(`${root}/scripts`);
			return Promise.all([
				fs.writeFile(
					`${root}/scripts/hotreload.js`,
					String(await fs.readFile('./scripts/hotreload.js'))
				),
				fs.writeFile(
					`${root}/scripts/hotreload-cleanup.js`,
					String(await fs.readFile('./scripts/hotreload-cleanup.js'))
				)
			]);
		}
	});

	await executeJobs(jobs);
}

async function executeJobs(jobs) {
	for (let i = 0; i < jobs.length; i++) {
		const { start, stop, task } = jobs[i];
		const s = spinner();
		s.start(start);
		try {
			await task();
		} catch (e) {
			s.stop();
			cancel(`Error: ${e.message}`);
			process.exit(-1);
		}
		s.stop(stop);
	}
}
