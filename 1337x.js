var got = require('got');
var cheerio = require('cheerio');
var Q = require('q');
var magnet = require('magnet-uri');

var base = "http://1337x.to";

function strToBytes(str) {
  let scale;
  if (!str) return 0;
  if (str.substr(-2) == 'KB') scale = 1000;
  else if (str.substr(-2) == 'MB') scale = 1000*1000;
  else if (str.substr(-2) == 'GB') scale = 1000*1000*1000;
  else if (str.substr(-2) == 'Kb') scale = 1024;
  else if (str.substr(-2) == 'Mb') scale = 1024*1024;
  else if (str.substr(-2) == 'Gb') scale = 1024*1024*1024;
  var num = str.substr(0,str.length-2).trim();
  return num*scale;
}

module.exports = {};

//----------------------------------------------------------------------------//
// Getting Series from Series list
//----------------------------------------------------------------------------//
function getSeriesPage(letter, page, callback, series) {
  got(base + '/series-library/' + letter + '/' + page + '/')
    .then(function(data){
      var $ = cheerio.load(data.body);

      $('.moive-info h3 a').each(function(i, elem) {
        var slug = $(this).attr('href').match(/^\/series\/([^\/]+)\//)[1];
        var title = $(this).attr('title');
        series.push({title: title, slug: slug});
      });

      var $paging = cheerio.load($('.pagging-box').html());
      var nextPage = $paging('li.active').next().text();
      if (nextPage > page) getSeriesPage(letter, page+1, callback, series);
      else callback(null, series);
    })
    .catch(function(err){
      callback(err);
    });
}

module.exports.series = function getSeries(letter) {
  var deferred = Q.defer();
  getSeriesPage(letter, 1, function(err, series) {
    if (err) deferred.reject(new Error(err));
    else deferred.resolve(series);
  }, []);
  return deferred.promise;
};

//----------------------------------------------------------------------------//
// Getting Torrents from Series page
//----------------------------------------------------------------------------//

module.exports.episodeTorrents = function getTorrents(slug, season, episode, callback) {
  return got(base + '/series/' + slug + '/' + season + '/' + episode + '/')
    .then(function(data) {
      var $ = cheerio.load(data.body);
      var torrents = [];
      $('.torrent-name > a').each(function(i, elem) {
        torrents.push({
          title: $(this).text(),
          link: base + $(this).attr('href')
        });
      });
      return torrents;
    });
};

//----------------------------------------------------------------------------//
// Getting Torrents from an Episode (Series page)
//----------------------------------------------------------------------------//

module.exports.getMagnet = function getTorrentData(torrentLink) {
  return got(torrentLink)
    .then(function(data) {
      var $ = cheerio.load(data.body);
      return $('.download-links-dontblock.btn-wrap-list > li:nth-child(1) > a').attr('href');
    });
};

//----------------------------------------------------------------------------//
// Getting Torrents from the Search page
//----------------------------------------------------------------------------//

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