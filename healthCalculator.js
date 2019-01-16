module.exports.calcHealth = function (torrent) {
    const seeds = torrent.seeders;
    const peers = torrent.leechers;
    const ratio = peers > 0 ? (seeds / peers) : seeds;
    const normalizedRatio = Math.min(ratio / 5 * 100, 100);
    const normalizedSeeds = Math.min(seeds / 30 * 100, 100);
    const weightedRatio = normalizedRatio * 0.6;
    const weightedSeeds = normalizedSeeds * 0.4;
    const weightedTotal = weightedRatio + weightedSeeds;
    const scaledTotal = ((weightedTotal * 3) / 100) | 0;
    return scaledTotal;
};