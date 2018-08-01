# Matrix Laggifier

![](https://raw.github.com/cjdelisle/matrix-laggifier/master/they_waitin.jpeg)

Matrix isn't slow, it's special. And this special bot can help you find out just how special your matrix/irc bridge really is.

## How to use

1. Make an account for the bot on a matrix server
2. curl your matrix server with the user and password to get the auth token:
  ```curl -XPOST -d '{"type":"m.login.password", "user":"BOT_USER_NAME", "password":"BOT_PASSWORD"}' "https://localhost:8448/_matrix/client/r0/login"'```
3. `cp ./config.example.js ./config.js`
4. Edit config.js
    * **baseUrl**: The URL of your matrix homeserver
    * **userName**: The full name of your bot
    * **accessToken**: Your bot's access token
    * **mkMatrixChannel**: Make a matrix channel from an irc channel, for freenode/matrix.org use `(x) => ('#freenode_' + x + ':matrix.org')`
    * **pingPongChan**: Name of an irc channel where the bot will ping-pong to check the lag
    * **otherChannels**: List of irc/matrix channels where the bot should be present
    * **bridgeHostRegex**: For checking whether a user is from matrix, for freenode/matrix.org use `/gateway\/shell\/matrix\.org/`
    * **ircServerHost**: The hostname of the IRC server
    * **ircNick**: Nickname for your bot on IRC side
5. `node ./index.js 2>&1 > /dev/null &  # Where logs belong` 

Then wait for a minute for it to pingpong at least once and then you will be able to use the
trigger `!lag` to get a lag report.

```
09:13 <@cjd> !lag
09:13 < status-ir> Matrix/IRC lag: 23372ms, last ping 71291ms ago
```

If you use `!lag` on IRC, you will be answered on IRC, if you use it on matrix, you will be
answere on matrix. Both bots will join whatever channel you specify in the conf.