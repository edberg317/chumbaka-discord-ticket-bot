module.exports = {
	int2hex: int => int.toString(16).toUpperCase(),

	some: async (array, func) => {
		for (const element of array) {
			if (await func(element)) return true;
		}
		return false;
	},
	wait: time => new Promise(res => setTimeout(res, time)),

	// obj example = {'creator_id': interaction.user.id, 'open': true}
	// data example = db.tickets.getData();
	findOne: (obj, data) => {
		// extract the key
		const objKeys = Object.keys(obj);
		for (const i of data) {
			let count = 0;
			for (const j of objKeys) {
				if (i[j] === obj[j]) {
					count++;
				}
			}
			if (count === objKeys.length) {
				return i;
			}
		}
		return null;
	},

	// obj example = {'creator_id': interaction.user.id, 'open': true}
	// data example = db.tickets.getData();
	findAndCountAll: (obj, data) => {
		const array = [];
		// extract the key
		const objKeys = Object.keys(obj);
		for (const i of data) {
			let count = 0;
			for (const j of objKeys) {
				if (i[j] === obj[j]) {
					count++;
				}
			}
			if (count === objKeys.length) {
				array.push(i);
			}
		}
		return array;
	},

	chunkArray: (arr, n) => {
		const chunkLength = Math.max(arr.length / n, 1);
		const chunks = [];
		for (let i = 0; i < n; i++) {
			if (chunkLength * (i + 1) <= arr.length)chunks.push(arr.slice(chunkLength * i, chunkLength * (i + 1)));
		}
		return chunks;
	},

};