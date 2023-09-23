import { exec } from 'child_process';
import { existsSync, lstatSync } from 'fs';

export function asyncExec(command) {
	return new Promise((resolve, reject) => {
		const child = exec(command);
		child.addListener('error', (err) => reject(err));
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

export async function isDirectory(path) {
	return lstatSync(path).isDirectory();
}
