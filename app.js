const express = require("express")
const session = require("express-session")
var SpotifyWebApi = require("spotify-web-api-node")
require("dotenv").config()
const fs = require("fs")
const stringify = require("csv-stringify").stringify

const app = express()
const port = 5000

var scopes = ["user-library-read"],
    state = "some-state-of-my-choice"

app.use(
    session({
        name: "markov sessionID cookie",
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 },
    })
)

// var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
// spotifyApi.clientCredentialsGrant

app.get("/", (req, res) => {
    var spotifyApi = createSpotifyApi()
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
    res.redirect(authorizeURL)
    console.log("Waiting for activation code!")
})

app.get("/callback", async (req, res) => {
<<<<<<< Updated upstream
    var spotifyApi = createSpotifyApi()
    // req.session.destroy()
=======
    // var spotifyApi = createSpotifyApi()
>>>>>>> Stashed changes
    const code = req.query.code
    console.log("Activaton code accuried, waiting for token...")
    await spotifyApi.authorizationCodeGrant(code).then(
        function (data) {
            console.log("The token expires in " + data.body["expires_in"])
            console.log("The access token is " + data.body["access_token"])
            console.log("The refresh token is " + data.body["refresh_token"])

            // Set the access token on the API object to use it in later calls
            req.session.token_info = data.body || {}
            req.session.save()

            // spotifyApi.setAccessToken(data.body["access_token"])
            // spotifyApi.setRefreshToken(data.body["refresh_token"])
        },
        function (err) {
            next(new Error("Token haven't acuired succesfuly!"))
            console.log(err)
        }
    )
    res.redirect("getTracks")
})

app.get("/getTracks", async (req, res, next) => {
    if (req.session.token_info) {
        console.log("Session has token: " + req.session.token_info["access_token"])
        let isExpired = req.session.token_info["expires_in"] - Date.now() < 60
        console.log("Has token expired: " + isExpired)
        if (isExpired) {
            spotifyApi = createSpotifyApi()
            spotifyApi.setAccessToken(req.session.token_info["access_token"])
            spotifyApi.setRefreshToken(req.session.token_info["refresh_token"])
            await spotifyApi.refreshAccessToken().then(
                function (data) {
                    console.log("The access token has been refreshed!")
                    // Save the access token so that it's used in future calls
                    // spotifyApi.setAccessToken(data.body["access_token"])
                    token_info = data.body["access_token"]
                    console.log(`New access token after refresh: ${token_info}`)
                },
                function (err) {
                    next(new Error("Could not refresh access token"))
                    console.log(err)
                }
            )
        }
        next()
    } else {
        next(new Error("Don't have access token!"))
    }
})

<<<<<<< Updated upstream
app.get("/getTracks", async (req, res) => {
    var spotifyApi = new SpotifyWebApi({
        accessToken: req.session.token_info["access_token"],
    })

    await spotifyApi
        .getMySavedTracks({
            limit: 50,
            offset: 0,
        })
        .then(
            function (data) {
                res.send(data)
            },
            function (err) {
                console.log("NEKA GRESKA PRI DOBAVLJANJU PLAJLISTE" + err)
                // res.send("Something went wrong!")
                //console.log("Something went wrong!", err)
            }
        )
=======
app.get("/getTracks", async (req, res, next) => {
    // var spotifyApi = new SpotifyWebApi({
    //     accessToken: req.session.token_info["access_token"],
    // })
    var iterator = 0
    var curGroup = []
    var result = []
    var val = {}
    var track = {}
    while (true) {
        await spotifyApi
            .getMySavedTracks({
                limit: 50,
                offset: 50 * iterator,
            })
            .then(
                function (data) {
                    curGroup = data.body["items"]
                    curGroup.forEach((item) => {
                        track = item["track"]
                        val["name"] = track["name"]
                        val["artist"] = track["artists"][0]["name"]
                        result.push({ ...val })
                    })

                    req.data = result //setting data to nex middleWare
                },
                function (err) {
                    next(new Error("Error with fetching playlist"))
                    console.log(err)
                    // res.send("Something went wrong!")
                    //console.log("Something went wrong!", err)
                }
            )
        iterator++
        if (curGroup.length < 50) {
            return next()
        }
    }
>>>>>>> Stashed changes
})

app.get("/getTracks", async (req, res, next) => {
    if (!req.data) return next()

    stringify(
        req.data,
        {
            header: true,
        },
        function (err, str) {
            const path = "./files/" + "songs" + ".csv"
            //create the files directory if it doesn't exist
            if (!fs.existsSync("./files")) {
                fs.mkdirSync("./files")
            }
            fs.writeFile(path, str, function (err) {
                if (err) {
                    console.error(err)
                    return res.status(400).json({
                        success: false,
                        message: "An error occurred! Files didn't save successfuly",
                    })
                }
                res.download(path, "songs.csv")
            })
        }
    )
})

app.listen(port, () => {
    console.log(`App listeing on port ${port}`)
})

function createSpotifyApi() {
    return new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: "http://localhost:5000/callback",
    })
}
