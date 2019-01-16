const got = require('got');
const cheerio = require('cheerio');
const ptt = require('parse-torrent-title');

const base = "http://1337x.to";

function parseQuality(title) {
  const info = ptt.parse(title);
  return info.resolution || null;
}

const leetx = {
  getMagnet(torrentLink) {
    return got(torrentLink)
    .then(function(data) {
      var $ = cheerio.load(data.body);
      return $('.download-links-dontblock.btn-wrap-list > li:nth-child(1) > a').attr('href');
    });
  },
  search(query, page = 1) {
    return got(base + '/search/' + encodeURIComponent(query) + '/' + page + '/')
      .then(function(data) {
        var $ = cheerio.load(data.body);
        var torrents = [];
        $('tbody > tr').each(function(i, rowElem) {
          $r = cheerio.load($(rowElem).html());
          const title = $r('.coll-1 > a').text();
          torrents.push({
            title,
            link: base + $r('.coll-1 > a:nth-child(2)').attr('href'),
            seeders: parseInt($r('.coll-2').text()),
            leechers: parseInt($r('.coll-3').text()),
            size: $r('.coll-4').text(),
            quality: parseQuality(title),
          });
        });
        console.log(torrents)
        return torrents;
      });
  },
}

leetx.search('iron man');

module.exports = leetx;