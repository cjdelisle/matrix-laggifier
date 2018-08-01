/*@flow*/
const Crypto = require('crypto');

const Irc = require('irc');
const Matrix = require("matrix-js-sdk");
const nThen = require('nthen');
const Bintrees = require('bintrees');

const Config = require('./config.js');

const EXPIRE_AFTER_MS = 1000 * 60 * 10;

const main = () => {

    let lagMs = -1;
    let tolm = -1;

    const outstanding = { };
    const expireTree = new Bintrees.RBTree((a, b) => { return a.date - b.date; });
    const addPing = () => {
        const rand = Crypto.randomBytes(8).toString('hex');
        let p = { rand: rand, date: +new Date() };
        expireTree.insert(p);
        outstanding[rand] = p;
        return p.rand;
    };
    const clearPing = (rand) => {
        const p = outstanding[rand];
        const now = +new Date();
        if (now - tolm > EXPIRE_AFTER_MS) { lagMs = Infinity; }
        if (!p) { return; }
        lagMs = now - p.date;
        tolm = now;
        expireTree.remove(p);
        delete outstanding[rand];
    };
    const clearExpired = () => {
        const now = +new Date();
        let item;
        while ((item = expireTree.min())) {
            if (now - item.date < EXPIRE_AFTER_MS) { break; }
            expireTree.remove(item);
        }
    };
    const onMessage = (noTriggers, msg, reply) => {
        let pingToken;
        msg.replace(/_PING_([^%]+)_/, (all, x) => {
            pingToken = x;
            return '';
        });
        if (pingToken) { reply('_PONG_' + pingToken + '_'); }
        msg.replace(/_PONG_([^%]+)_/, (all, x) => {
            pingToken = x;
            return '';
        });
        if (pingToken) { clearPing(pingToken); }
        if (noTriggers) { return; }
        if (msg === '!lag') {
            reply('Matrix/IRC lag: ' + lagMs + 'ms, last ping ' + (+new Date() - tolm) + 'ms ago');
        }
    };

    const chans = Config.otherChannels.slice(0);
    chans.push(Config.pingPongChan);

    let ircClient = new Irc.Client(Config.ircServerHost, Config.ircNick, {
        debug: false,
        channels: chans.slice(0),
    });
    ircClient.addListener('error', (message) => {
        console.log('irc> error: ', message);
    });
    ircClient.addListener('message', (from, to, message, more) => {
        //console.log('irc> <%s> %s', from, message);
        if (from === ircClient.nick) { return void console.log('from me'); }
        const noTriggers = Config.bridgeHostRegex.test(more.host);
        //console.log(more);
        onMessage(noTriggers, message, (msg) => { ircClient.say(to, msg); });
    });

    let client;
    let pingPongChan;
    nThen((w) => {
        client = Matrix.createClient({
            baseUrl: Config.baseUrl || ('https://' + Config.userName.split(':')[1]),
            accessToken: Config.accessToken,
            userId: Config.userName
        });

        const done = w();
        client.on('sync', function (state, prevState, data) {
            if (state === 'ERROR') { console.log(data); }
            if (state === 'PREPARED') { done(); }
        });
        client.startClient();
    }).nThen((w) => {
        chans.forEach((c) => {
            client.joinRoom(Config.mkMatrixChannel(c))
            .error((err) => { console.error("Failed to join room " + c, err); w.abort(); })
            .done(w((sc) => { if (c === Config.pingPongChan) { pingPongChan = sc; } }));
        });
    }).nThen((w) => {
        // print incoming messages.
        client.on("Room.timeline", (event, room, toStartOfTimeline) => {
            if (toStartOfTimeline) {
                return; // don't print paginated results
            }
            //if (pingPongChan.roomId !== room.roomId) { return; }
            if (!(event.event && event.event.type === 'm.room.message')) { return; }
            if (!(event.event.content && event.event.content.msgtype === 'm.text')) { return; }
            if (event.event.user_id === Config.userName) { return; }

            //console.log(event.event);

            const noTriggers = event.event.sender.indexOf('@irc_') === 0;

            onMessage(noTriggers, event.event.content.body, (reply) => {
                client.sendTextMessage(room.roomId, reply);
            });
            //console.log(event);
        });

        setInterval(() => {
            clearExpired();
            client.sendTextMessage(pingPongChan.roomId, "_PING_" + addPing() + '_');
        }, 60000);
    }).nThen((w) => {
        console.log("Done");
        //client.stopClient();
    });
};
main();