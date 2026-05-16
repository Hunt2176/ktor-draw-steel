const target = 'http://localhost:8082';

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
