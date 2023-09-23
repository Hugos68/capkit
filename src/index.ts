#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init.js';

const program = new Command();

program.version('0.0.1');
program.command('initialize').alias('init').description('initialize capkit').action(init);
program.parse(process.argv);
