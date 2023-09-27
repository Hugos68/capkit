#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init.js';
import fs from 'fs';

const program = new Command();

program.version(JSON.parse(String(fs.readFileSync('package.json')))['version']);
program.command('initialize').alias('init').description('initialize capkit').action(init);
program.parse(process.argv);

export { initializeProject } from './commands/init.js';
export {
	ProjectOptions,
	Platform,
	Plugin,
	ConfigExtension,
	PackageManager
} from './types/types.js';
