const express = require('express');
const server = express();

server.all('/', (req, res) => {
	res.send('Result: [OK].');
});

function keepAlive() {
	server.listen(process.env.PORT || 3001, () => {
		console.log('Server is now ready! | ' + Date.now());
	});
}

module.exports = keepAlive;