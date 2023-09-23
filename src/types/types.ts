export type Job = {
	start: string;
	stop: string;
	task: () => Promise<unknown>;
};

export type ProjectOptions = {
	name: string;
	id: string;
	selectedPlatforms: string[];
	selectedPlugins: string[];
	configExtension: string;
	pm: string;
};
