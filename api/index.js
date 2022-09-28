const app = require('express')();
const { v4 } = require('uuid');


app.get('/api', (req, res) => {
  const path = `/api/item/${v4()}`;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
	chrome = require("chrome-aws-lambda");
	puppeteer = require("puppeteer-core");
} else {
	puppeteer = require("puppeteer")
}


app.get('/api/results', async (req, res) => {
	let options = {};

	if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
		options = {
			args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
			defaultViewport: chrome.defaultViewport,
			executablePath: await chrome.executablePath,
			headless: true,
			ignoreHTTPSErrors: true,
		}
	}

	try {
		let browser = await puppeteer.launch(options)
		let page = await browser.newPage();
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

							res.json(scrapeData)

							browser.close();
						})
					}, 2000);
				})
			})
		}, 2000);

	} catch (err) {
		console.error(err);
		return null;
	}
});

module.exports = app;
