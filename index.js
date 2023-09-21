#!/usr/bin/env node
import { Command } from 'commander';
import { intro, text, multiselect, outro, spinner } from '@clack/prompts';
import { exec } from 'child_process';
import { promises as fs, existsSync, mkdirSync } from 'fs';

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
		outro(`You're all set!`);
	});
program.parse(process.argv);

async function promptOptions() {
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
			{ value: 'iOS', label: 'iOS' },
			{ value: 'Android', label: 'Android' }
		],
		required: false
	});

	return {
		name,
		id,
		platforms
	};
}

async function initializeProject({ name: appName, id: appId, platforms }) {
	const jobs = [];

	jobs.push({
		start: 'Installing Capacitor',
		stop: 'Successfully installed Capacitor',
		task: async () => asyncExec('npm install @capacitor/core @capacitor/cli')
	});

	jobs.push({
		start: 'Creating capacitor.config.json',
		stop: 'Successfully created capacitor.config.json',
		task: async () =>
			fs.writeFile(
				'capacitor.config.json',
				JSON.stringify({ appId, appName, webDir: 'build' }, null, 2)
			)
	});

	if (platforms.length > 0) {
		jobs.push({
			start: 'Adding platforms',
			stop: 'Successfully added platforms',
			task: async () =>
				Promise.all([
					asyncExec('npm install @capacitor/android && npx cap add android'),
					asyncExec('npm install @capacitor/ios && npx cap add ios')
				])
		});

		jobs.push({
			start: 'Building project',
			stop: 'Successfully built project',
			task: async () => asyncExec('npm run build')
		});

		jobs.push({
			start: 'Syncing platforms',
			stop: 'Successfully synced platforms',
			task: async () => asyncExec('npx cap sync')
		});
	}

	jobs.push({
		start: 'Creating hotreload scripts',
		stop: 'Successfully created hotreload scripts',
		task: async () => {
			if (!existsSync('./test')) mkdirSync('./test');
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
			s.stop(`Error: ${e.message}`);
			throw e;
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
