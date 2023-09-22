#!/usr/bin/env node
import { Command } from 'commander';
import { intro, text, multiselect, confirm, cancel, outro, spinner } from '@clack/prompts';
import { exec } from 'child_process';
import { promises as fs, existsSync } from 'fs';

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

	const platforms = await multiselect({
		message: 'What platforms do you want to add? (Optional)',
		options: [
			{ value: 'Android', label: 'Android' },
			{ value: 'iOS', label: 'iOS' }
		],
		required: false
	});

	return {
		name,
		id,
		platforms,
		configExtension
	};
}

async function initializeProject({ name: appName, id: appId, platforms, configExtension }) {
	const jobs = [];

	jobs.push({
		start: 'Installing Capacitor',
		stop: 'Successfully installed Capacitor',
		task: async () =>
			Promise.all([
				asyncExec('npm install @capacitor/core'),
				asyncExec('npm install @capacitor/cli')
			])
	});

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

	if (platforms.length > 0) {
		jobs.push({
			start: `Adding platforms (${platforms})`,
			stop: `Successfully added platforms (${platforms})`,
			task: async () =>
				Promise.all(
					platforms.map((platform) =>
						asyncExec(
							`npm install @capacitor/${platform.toLowerCase()} && npx cap add ${platform.toLowerCase()}`
						)
					)
				)
		});
	}

	jobs.push({
		start: 'Creating hotreload scripts',
		stop: 'Successfully created hotreload scripts',
		task: async () => {
			return Promise.all([
				fs.writeFile('./scripts/hotreload.js', String(await fs.readFile('./scripts/hotreload.js'))),
				fs.writeFile(
					'./scripts/hotreload-cleanup.js',
					String(await fs.readFile('./scripts/hotreload-cleanup.js'))
				)
			]);
		}
	});

	jobs.push({
		start: 'Adding custom scripts to package.json',
		stop: 'Successfully added custom scripts to package.json',
		task: async () => {
			const packageJson = JSON.parse(await fs.readFile('package.json'));
			packageJson.scripts['dev:cap'] =
				'node ./scripts/hotreload.js && npx cap sync && node ./scripts/hotreload-cleanup.js && npm run build';
			packageJson.scripts['build:cap'] = 'npm run build && npx cap sync';
			return fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
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
			cancel('Error: ${e.message}');
			process.exit(-1);
		}
		s.stop(stop);
	}
}

function asyncExec(command) {
	return new Promise((resolve, reject) => {
		const child = exec(command);
		child.addListener('error', reject);
		child.addListener('exit', resolve);
	});
}

function getConfigExtension() {
	const configExtensions = ['json', 'js', 'ts'];
	for (const extension of configExtensions) {
		if (existsSync(`capacitor.config.${extension}`)) {
			return extension;
		}
	}
}
