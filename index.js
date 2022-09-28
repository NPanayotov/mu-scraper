const puppeteer = require('puppeteer')
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});


async function scrape() {
	const browser = await puppeteer.launch({})
	const page = await browser.newPage();
	const scrapeData = {};

	await page.goto('https://mubz.bg/#!boss#all', {
		waitUntil: 'load'
	});

	setTimeout(() => {
		const content = page.content();

		content.then(data => {
			const bosses = data.split('Last Kill by:').pop().split('Refresh')[0].split('<tbody>').pop().split('</tbody>')[0];

			scrapeData.bosses = bosses;

			page.goto('https://mubz.bg/#!golden_mobs#all', {
				waitUntil: 'load'
			}).then(data => {
				setTimeout(() => {
					const goldenContnt = page.content();

					goldenContnt.then(data => {
						const golden = data.split('Golden Monster:').pop().split('Refresh')[0].split('<tbody>').pop().split('</tbody>')[0];

						scrapeData.golden = golden;

						io.emit('scraped', scrapeData);

						browser.close();

						setTimeout(() => {
							scrape()
						}, 60000);
					})
				}, 2000);
			})
		})
	}, 2000);
}

scrape();
