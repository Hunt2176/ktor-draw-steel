const target = 'http://localhost:8080';

module.exports = {
	'/watch': {
		target,
		secure: false,
		changeOrigin: true,
		ws: true,
	},
	'/files': {
		target,
		secure: false,
		changeOrigin: true,
	},
	'/api': {
		target,
		secure: false,
		changeOrigin: true,
	},
	'/static': {
		target,
		secure: false,
		changeOrigin: true,
	},
	'/kanka': {
		target,
		secure: false,
		changeOrigin: true,
	},
};
