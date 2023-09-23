import { cancel } from '@clack/prompts';
import { spinner } from '@clack/prompts';
import { exec } from 'child_process';
import { existsSync, lstatSync } from 'fs';
import { Job } from '../types/types.js';

export function asyncExec(command: string) {
	return new Promise((resolve, reject) => {
		const child = exec(command);
		child.addListener('error', reject);
		child.addListener('exit', resolve);
	});
}

export function getConfigExtension() {
	const configExtensions = ['json', 'js', 'ts'];
	for (const extension of configExtensions) {
		if (existsSync(`capacitor.config.${extension}`)) {
			return extension;
		}
	}
}

export function getPM() {
	const userAgent = process.env.npm_config_user_agent;
	if (!userAgent) {
		return 'npm';
	}
	const pmSpec = userAgent.split(' ')[0] || '';
	const separatorPos = pmSpec.lastIndexOf('/');
	const name = pmSpec?.substring(0, separatorPos);
	return name === 'npminstall' ? 'npm' : name;
}

export function isDirectory(path: string) {
	return lstatSync(path).isDirectory();
}

export async function executeJobs(jobs: Job[]) {
	for (let i = 0; i < jobs.length; i++) {
		const { start, stop, task } = jobs[i];
		const s = spinner();
		s.start(start);
		try {
			await task();
		} catch (e) {
			if (typeof e === 'string') cancel(`Error: ${e}`);
			else if (e instanceof Error) cancel(`Error: ${e.message}`);
			process.exit(-1);
		}
		s.stop(stop);
	}
}
