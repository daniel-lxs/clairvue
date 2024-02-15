import Parser from 'rss-parser';

const parser: Parser = new Parser();

(async () => {
	const feed = await parser.parseURL('https://www.reddit.com/.rss');
	console.log(feed);
})();
