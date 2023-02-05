require('dotenv').config();
const { Client } = require('@notionhq/client');

// Initializing a client
const notion = new Client({
	auth: process.env.NOTION_API_KEY,
});

function getCombinations(arr) {
	let result = [];

	function combination(temp, index) {
		if (index === arr.length) {
			result.push(temp);
			return;
		}

		combination(temp.concat(arr[index]), index + 1);
		combination(temp, index + 1);
	}

	combination([], 0);
	result = result.filter((temp) => temp.length > 0);
	result.sort((a, b) => b.length - a.length || b[0] - a[0]);
	return result;
}

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

	searchNotionDatabase: async (keywords) => {

		// Search all the pages and database that connected with the Notion Integration
		const results = await notion.search();

		// Return if there's no results found
		if (!results) {
			return false;
		}

		// Get all the database results only (results.results is a list of objects)
		const databaseResults = [];
		results.results.some(result => {
			if (result.parent.type === 'database_id') {
				databaseResults.push(result);
			}
		});

		// Get all the unique tags from all the database results
		// (databaseResults is a list of objects)
		// (...properties.Tags.multi_select is a list of objects)
		const allTags = [];
		databaseResults.some(result => {
			result.properties.Tags.multi_select.some(tag => {
				allTags.push(tag.name);
			});
		});
		const uniqueTags = allTags.filter((item, index, self) => self.indexOf(item) === index);

		// Get all the searchTerm in lowercase (the searchTerm will be used to match with Tags)
		const searchTerm = keywords.split(' ').map(keyword => keyword.toLowerCase());

		// Get all the matchTags (searchTerm intersect with allTags)
		const matchTags = uniqueTags.filter(x => searchTerm.includes(x));

		// Get different combinations of tags in descending order (combinations is a list of lists)
		// eg. [['learn','hardware'],['learn'],['hardware']]
		const combinations = getCombinations(matchTags);

		// compare each of the combinations with each of the databaseResults' tags
		// to find combinations subset of databaseResults' tags
		const matchResults = [];

		combinations.some(combination => {
			databaseResults.some(result => {
				const tags = [];
				result.properties.Tags.multi_select.some(tag => {
					tags.push(tag.name);
				});
				if (combination.every((item) => tags.includes(item)) && !matchResults.includes(result)) {
					matchResults.push(result);
				}
			});
		});

		let helpfulResources = '';
		for (let i = 0; i < matchResults.length; i++) {
			// there is a limitation of 4096 characters for Discord Message Embed
			if (helpfulResources.length < 3750) {
				helpfulResources += `**${i + 1}. `;
				helpfulResources += `${matchResults[i].properties.Title.title[0].plain_text}**\n`;
				helpfulResources += `${matchResults[i].url}\n\n`;
			}
		}

		return helpfulResources;

		/*
		// Filter the database using the keywords
		// need to consider null
		const results = columns.results.filter(column => {
			return keywords.some(keyword => {
			  return (
				column.properties.title.title[0].text.content.toLowerCase().includes(keyword.toLowerCase()) ||
				column.properties.description.rich_text[0].text.content.toLowerCase().includes(keyword.toLowerCase())
				// (typeof column.properties.tags.title[0].text.content === 'string' && column.properties.title.title.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)
				// (typeof column.properties.description.rich_text[0].text.content === 'string' && column.properties.description.rich_text[0].text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)
			  );
			});
		  });


		// Return the list of matchable notion links
		return results.map(result => result.properties.link.url);
		*/
	},
};
