const express = require("express")
const session = require("express-session")
var SpotifyWebApi = require("spotify-web-api-node")
require("dotenv").config()

const app = express()
const port = 5000

var scopes = ["user-library-read", "playlist-read-private"],
    state = "some-state-of-my-choice"

global.spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: "http://localhost:5000/callback",
})

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
    // var spotifyApi = createSpotifyApi()
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
    res.redirect(authorizeURL)
    console.log("IDEM PO JEBENI AKTIVACIONI KOD")
})

app.get("/callback", async (req, res) => {
    // var spotifyApi = createSpotifyApi()
    // req.session.destroy()
    const code = req.query.code
    console.log("IMAM KOD CEKAM TOKEN USRANI")

    await spotifyApi.authorizationCodeGrant(code).then(
        function (data) {
            console.log("The token expires in " + data.body["expires_in"])
            console.log("The access token is " + data.body["access_token"])
            console.log("The refresh token is " + data.body["refresh_token"])

            // Set the access token on the API object to use it in later calls
            req.session.token_info = data.body || {}
            // req.session.save()

            spotifyApi.setAccessToken(data.body["access_token"])
            spotifyApi.setRefreshToken(data.body["refresh_token"])
        },
        function (err) {
            console.log("NESTO SE SJEBALO KOD DOBAVLJANJA TOKENA", err)
        }
    )
    res.redirect("getTracks")
})

app.get("/getTracks", async (req, res, next) => {
    if (req.session.token_info) {
        console.log("SESIJA IMA TOKEN INFO " + req.session.token_info)
        let isExpired = req.session.token_info["expires_in"] - Date.now() < 60
        console.log("DA LI JE TOKEN ISTEKAO " + isExpired)
        if (isExpired) {
            //spotifyApi = createSpotifyApi()
            // spotifyApi.setAccessToken(req.session.token_info["access_token"])
            // spotifyApi.setRefreshToken(req.session.token_info["refresh_token"])
            await spotifyApi.refreshAccessToken().then(
                function (data) {
                    console.log("The access token has been refreshed!")
                    // Save the access token so that it's used in future calls
                    // spotifyApi.setAccessToken(data.body["access_token"])
                    token_info = data.body["access_token"]
                    console.log(`New access token after refresh ${token_info}`)
                },
                function (err) {
                    console.log("Could not refresh access token", err)
                }
            )
        }
        next()
    } else {
        next(new Error("NEMAS JEBENI TOKEN"))
    }
})

app.get("/getTracks", async (req, res) => {
    // var spotifyApi = new SpotifyWebApi({
    //     accessToken: req.session.token_info["access_token"],
    // })
    var iterator = 0
    var allSongs = 0
    while (true) {
        await spotifyApi
            .getMySavedTracks({
                limit: 50,
                offset: 50 * iterator,
            })
            .then(
                function (data) {
                    allSongs = data.body["items"].length
                    console.log(`sve spesme ${allSongs}`)
                    res.send(data.body["items"])
                },
                function (err) {
                    console.log("NEKA GRESKA PRI DOBAVLJANJU PLAJLISTE" + err)
                    // res.send("Something went wrong!")
                    //console.log("Something went wrong!", err)
                }
            )
        iterator++
        if (allSongs < 50) break
    }
})

app.listen(port, () => {
    console.log(`App listeing on port ${port}`)
})
