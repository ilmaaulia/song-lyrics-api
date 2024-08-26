const axios = require("axios");
const cheerio = require("cheerio");
const { json, errorJson } = require('../utils/response');

exports.index = (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    
    return json(res, {
        maintainer: 'Azhari Muhammad M <azhari.marzan@gmail.com>',
        source: 'https://github.com/azharimm/song-lyrics-api',
        hot_lyrics: {
            endpoint: '/hot',
            example: fullUrl + 'hot'
        },
        detail_lyrics: {
            endpoint: '/lyrics/:id',
            example: fullUrl + 'lyrics/-c-chrisye-kala+cinta+menggoda_20227653'
        },
        search_lyrics: {
            endpoint: '/lyrics/search',
            example: fullUrl + 'search?q=Kala cinta menggoda'
        }
    });
}

exports.hotLyrics = async (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    try {
        const { data: htmlResult } = await axios.get(`${process.env.BASE_URL}/top`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
            }
        });
        const $ = cheerio.load(htmlResult);
        const hotsongLists = [];
        $(".lf-list__row").each((index, el) => {
            let songId = $(el)
                .children(".lf-list__subtitle")
                .children("a")
                .attr("href");
                
            let artist = $(el)
                .children(".lf-list__title")
                .children("span")
                .text()
                .replace(/\s+/g, "")
                .replace(/([A-Z])/g, " $1")
                .trim();
            let songTitle = $(el)
                .children(".lf-list__subtitle")
                .children("a")
                .text()
                .replace(/\s+/g, "")
                .replace(/([A-Z])/g, " $1")
                .trim()
                .replace("Lyrics", "");
            if(index > 0) {
                let id = songId.split(".html")[0]
                .replace(/\//g, "-");
                hotsongLists.push({
                    songId: id,
                    artist,
                    songTitle,
                    songLyrics: `${baseUrl}/lyrics/${id}`
                });
            }
        });
        return json(res, hotsongLists);
    } catch (error) {
        return errorJson(res, "Failed to fetch hot lyrics");
    }
}

exports.detailLyrics = async (req, res) => {
    let id = req.params.id;
    if (!id) {
        return errorJson(res, "Mohon isi song id");
    }
    try {
        let songId = id.replace(/-/g, "/") + '.html';
        const { data: htmlResult } = await axios.get(`${process.env.BASE_URL}${songId}`);
        const $ = cheerio.load(htmlResult);
        const artist = $(".lyric-song-head").children("a").text();
        const songTitle = $(".lyric-song-head").text().split("–")[1].replace("Lyrics", "").trim();
        const songLyrics = $("#content").text().trim();
        const songLyricsArr = songLyrics.split("\n");
        return json(res, {
            artist,
            songTitle,
            songLyrics,
            songLyricsArr,
        });
    } catch (error) {
        return errorJson(res, "Mohon isi id dengan valid id");        
    }
}

exports.searchLyrics = async (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    const { q } = req.query;
    if (!q) {
        return errorJson(res, "Mohon isi query pencarian!");
    }
    try {
        const { data: htmlResult } = await axios.get(`${process.env.BASE_URL}/search.php?q=${q}`);
        const $ = cheerio.load(htmlResult);
        const resultLists = [];
        $(".lf-list__row").each((index, el) => {
            let songId = $(el)
                .children(".lf-list__meta")
                .children("a")
                .attr("href");
                
            let artist = $(el)
                .children(".lf-list__title--secondary")
                .children("a")
                .text()
                .replace(/\s+/g, "")
                .replace(/([A-Z])/g, " $1")
                .trim();
            let songTitle = $(el)
                .children(".lf-list__meta")
                .children("a")
                .text()
                .replace(/\s+/g, "")
                .replace(/([A-Z])/g, " $1")
                .trim()
                .replace("Lyrics", "");
            if(index > 0) {
                let id = songId.split(".html")[0]
                .replace(/\//g, "-");
                resultLists.push({
                    songId: id,
                    artist,
                    songTitle,
                    songLyrics: `${baseUrl}/lyrics/${id}`
                });
            }
        });

        return json(res, resultLists);
    } catch (error) {
        return errorJson(res, "Failed to search lyrics");
    }
}

exports.test = async (req, res) => {
    try {
        const { data: htmlResult } = await axios.get(`${process.env.BASE_URL_V2}`, {
            headers: {
                'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.112 Safari/534.30"
            }
        });
        const $ = cheerio.load(htmlResult);
        const resultLists = [];
        $(".list-group-item").each((index, el) => {
            const text = $(el).text();
            resultLists.push(text);
        });

        return json(res, resultLists);
    } catch (error) {
        return errorJson(res, "Failed to fetch test data");
    }
}
