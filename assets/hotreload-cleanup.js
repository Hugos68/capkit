import fs from 'fs';
const files = fs.readdirSync('./');
files.forEach((file) => {
	if (file.match(/capacitor\.config\.json\.timestamp-\d+/g)) {
		fs.copyFileSync(`./${file}`, './capacitor.config.json');
		fs.unlinkSync(file);
	}
});
