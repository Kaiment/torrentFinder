const RarbgApi = require('rarbg');
const leetx = require('./1337x.js');
const axios = require('axios');
const _ = require('lodash');

const LINK = 'https://github.com/PatrickE94/leetxapi'

const rarbg = new RarbgApi();
const ytsUri = 'https://yts.am/api/v2/list_movies.json';

async function rarbgFinder(movie, category) {
  const categorySearch = category || 'movies';
  const result = await rarbg.search({
    search_themoviedb: movie.moviedbId,
    sort: 'seeders',
    category: categorySearch,
  });
  console.log(result);
  return result;
}

async function ytsFinder(movie) {
  const title = escape(movie.title);
  const request = await axios.get(`${ytsUri}?query_term=${title}&sort_by=seeds`);
  const result = request.data.data;
  const torrents = [];
  for (let i = 0; i < result.movie_count; i += 1) {
    const resultMovie = result.movies[i];
    resultMovie.torrents.forEach((t) => {
      const torrent = {
        title: resultMovie.title,
        quality: t.quality,
        size: t.size,
        dlLink: t.url,
        seeders: t.seeds,
        leechers: t.peers,
        ratio: parseFloat((t.seeds / t.peers).toFixed(1), 10),
      };
      torrents.push(torrent);
    });
  }
  return torrents;
}

async function leetxFinder(movie) {
  const torrents = await leetx.search(movie.title, '1');
  let promises = [];
  for (let i = 0; i < torrents.length; i += 1) {
    promises.push(leetx.getMagnet(torrents[i].link));
  }
  promises = await Promise.all(promises)
  for (j = 0; j < promises.length; j += 1) {
    torrents[j].dlLink = promises[j];
    if (torrents[j].leechers <= 0) {
      torrents[j].ratio = torrents[j].seeders;
    } else {
      torrents[j].ratio = parseFloat((torrents[j].seeders / torrents[j].leechers).toFixed(1), 10)
    }
    torrents[j].quality = null;
  }
  return torrents;
}

const torrentFinder = {
  async search(movie) {
    const promises = [];
    promises.push(leetxFinder(movie));
    promises.push(ytsFinder(movie));
    let torrentArrays = await Promise.all(promises);
    let torrents = torrentArrays[0].concat(torrentArrays[1]);
    torrents = _.sortBy(torrents, (e) => e.ratio).reverse();
    console.log(torrents);
  },
};

module.exports = torrentFinder;
