const RarbgApi = require('rarbg');
const leetx = require('./1337x.js');
const axios = require('axios');
const _ = require('lodash');
const hc = require('./healthCalculator.js');

const rarbg = new RarbgApi();
const ytsUri = 'https://yts.am/api/v2/list_movies.json';

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
        ratio: hc.calcHealth({ seeders: t.seeds, leechers: t.peers }),
        releaseDate: resultMovie.year,
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
    torrents[j].ratio = hc.calcHealth(torrents[j]);
  }
  return torrents;
}

const torrentFinder = {
  async search(movie) {
    let leetxTorrents = [];
    let ytsTorrents = [];
    try {
      leetxTorrents = await leetxFinder(movie);
    } catch (err) {
    }
    try {
      ytsTorrents = await ytsFinder(movie);
    } catch (err) {
    }
    let torrents = leetxTorrents.concat(ytsTorrents);
    torrents = torrents.filter(torrent => torrent.title.toLowerCase() === movie.title.toLowerCase())
    torrents = _.sortBy(torrents, (e) => e.ratio).reverse();
    torrents = torrents.filter(torrent => torrent.releaseDate === movie.releaseDate);
    let selectedTorrents = [];
    selectedTorrents = selectedTorrents.concat(torrents.filter(torrent => torrent.quality === '1080p'))
    selectedTorrents = selectedTorrents.concat(torrents.filter(torrent => torrent.quality === '720p'))
    selectedTorrents = selectedTorrents.concat(torrents.filter(torrent => torrent.quality === undefined))
    return selectedTorrents.splice(0, 20);
  },
};

module.exports = torrentFinder;
