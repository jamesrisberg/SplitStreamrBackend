/// <reference path="../../typings/main.d.ts"/>

import ws = require('ws');
import shortid = require('shortid');

export class WebSocketHandler {
    private sessions;

    constructor(private wss: ws.Server) {
        this.setupServer();
    };

    setupServer() {
        this.wss.on('connection', ws => {
            var clientID = shortid.generate();
            ws.on('message', (data: string) => {
                try {
                    var obj = JSON.parse(data);
                    switch(obj.message) {
                    case 'New Session':
                        this.newSession(ws, clientID);
                        break;
                    case 'Join Session':
                        this.joinSession(ws, clientID, obj.session);
                        break;
                    case 'Stream Song':
                        this.streamSong(ws, clientID, obj.session, obj.filename);
                    }
                } catch (ex) {
                    this.handleError(ws, clientID, ex);
                }
            });
        });
    }

    newSession(ws: ws, clientID: string) {
        var session: string = shortid.generate();
        this.sessions[session] = {
            members: [clientID],
            song: '',
            currentChunk: 0
        };
        ws.send(JSON.stringify({ message: 'new session', session: 'session'}));
    }

    joinSession(ws: ws, clientID: string, session: string) {
        if (this.sessions[session]) {
            this.sessions[session].members.push(clientID);
            ws.send(JSON.stringify({ message: 'join session', session: 'session'}));
        } else {
            this.handleError(ws, clientID, 'Session does not exist')
        }
    }

    streamSong(ws: ws, clientID: string, session: string, filename: string) {
        
    }

    handleError(ws: ws, clientID: string, e: string) {
        ws.send(JSON.stringify({message: 'error', error: e}));
    }
}
