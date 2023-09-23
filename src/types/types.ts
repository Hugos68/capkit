export type Job = {
	start: string;
	stop: string;
	task: () => Promise<unknown>;
};

export type ProjectOptions = {
	name: string;
	id: string;
	selectedPlatforms: Platform[];
	selectedPlugins: Plugin[];
	configExtension: ConfigExtension | null;
	pm: PackageManager;
};

export type Platform = 'Android' | 'iOS';

export type Plugin =
	| 'action-sheet'
	| 'app'
	| 'app-launcher'
	| 'browser'
	| 'camera'
	| 'clipboard'
	| 'device'
	| 'dialog'
	| 'filesystem'
	| 'geolocation'
	| 'google-maps'
	| 'haptics'
	| 'keyboard'
	| 'local-notifications'
	| 'motion'
	| 'network'
	| 'preferences'
	| 'push-notifications'
	| 'screen-reader'
	| 'share'
	| 'splash-screen'
	| 'status-bar'
	| 'text-zoom'
	| 'toast';

export type ConfigExtension = 'json' | 'js' | 'ts';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
