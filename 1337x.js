var got = require('got');
var cheerio = require('cheerio');

module.exports.getMagnet = function getTorrentData(torrentLink) {
  return got(torrentLink)
    .then(function(data) {
      var $ = cheerio.load(data.body);
      return $('.download-links-dontblock.btn-wrap-list > li:nth-child(1) > a').attr('href');
    });
};

module.exports.search = function search(query, page) {
  return got(base + '/search/' + encodeURIComponent(query) + '/' + page + '/')
    .then(function(data) {
      var $ = cheerio.load(data.body);
      var torrents = [];
      $('tbody > tr').each(function(i, rowElem) {
        $r = cheerio.load($(rowElem).html());
        torrents.push({
          title: $r('.coll-1 > a').text(),
          link: base + $r('.coll-1 > a:nth-child(2)').attr('href'),
          seeders: parseInt($r('.coll-2').text()),
          leechers: parseInt($r('.coll-3').text()),
          size: $r('.coll-4').text(),
        });
      });
      return torrents;
    });
};