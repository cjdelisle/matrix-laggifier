process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
module.exports = {
    baseUrl: 'https://m.trnsz.com:8448', // https://matrix.org
    userName: '@status-bot:m.trnsz.com',
    accessToken: ```curl -XPOST -d '{"type":"m.login.password", "user":"example", "password":"wordpass"}' "https://localhost:8448/_matrix/client/r0/login"'```,
    mkMatrixChannel: (x) => ('#fc00-irc_' + x + ':m.trnsz.com'),
    pingPongChan: '#matrix-status',
    otherChannels: [ '#cjdns' ],
    bridgeHostRegex: /fcab:cef8:1114:ace5:b0c1:41d4:8861:4849/, // /gateway\/shell\/matrix\.org/
    ircServerHost: 'fcec:ae97:8902:d810:6c92:ec67:efb2:3ec5', // irc.freenode.net
    ircNick: 'status-irc'
};