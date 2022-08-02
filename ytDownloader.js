const fs = require("fs")
const parse = require("csv-parse").parse
const scrapeYt = require("scrape-yt")
const youtubedl = require("youtube-dl-exec")
const os = require("os")

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}
function readCsv() {
    const filePath = "./files/songs.csv"

    const data = fs.readFileSync(filePath)
    parse(data, async (err, records) => {
        if (err) {
            console.error(err)
        }
        videoIds = []
        videoIds = await downloadVideosFromTitles(records)
        // console.log("Iz readCsv:" + videoIds)
        await downloadVideosFromIds(videoIds)
    })
}

async function downloadVideosFromTitles(records) {
    var videoIds = []
    await asyncForEach(records, (track) => {
        return scrapeVideoId(track[0], track[1]).then((videoId) => {
            return videoIds.push(videoId)
        })
    })

    return videoIds

    // downloadVideosFromIds(videoIds)
}

async function downloadVideosFromIds(videoIds) {
    console.log("Downloading songs")
    asyncForEach(videoIds, (videoId) => {
        return youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
            // extractAudio: true,
            // preferFfmpeg: true,
            // ffmpegLocation: "C:/Users/Marko/Desktop/Marko/SpotifyDownloader/ffmpeg",
            // audioFormat: "mp3",
        }).then((output) => console.log(output))
    })
}
function scrapeVideoId(name, artist) {
    console.log(`Getting video id for: ${name} - ${artist}`)
    return scrapeYt
        .search(name + " " + artist, {
            type: "video",
        })
        .then(
            (videos) => {
                return videos[0].id //moze i bez ovoga je promise podrazumevano returnuje vrendost
            },
            (error) => {
                console.log(error)
            }
        )
}

readCsv()
