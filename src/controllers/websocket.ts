/// <reference path="../../typings/main.d.ts"/>

import ws = require('ws');
import shortid = require('shortid');
import _ = require('lodash');

export class WebSocketHandler {
    private sessions;
    private connections;

    constructor(private wss: ws.Server) {
        this.setupServer();
    };

    setupServer() {
        this.wss.on('connection', ws => {
            var clientID = shortid.generate();

            this.connections[clientID] = {
                ws: ws,
                session: undefined
            }

            ws.on('message', (data: string) => {
                try {
                    // Parse and handle incoming message.
                    var messageObj = JSON.parse(data);
                    this.handleNewMessage(ws, clientID, messageObj);
                } catch (ex) {
                    this.handleError(ws, clientID, ex);
                }
            });

            ws.on('close', () => {
                // Cleanup sessions and connections
                this.removeFromSession(clientID);
                delete this.connections[clientID];
            });
        });
    }

    handleNewMessage(ws: ws, clientID: string, messageObj) {
       switch(messageObj.message) {
       case 'new session':
           this.newSession(ws, clientID);
           break;
       case 'join session':
           this.joinSession(ws, clientID, messageObj.session);
           break;
       case 'stream song':
           this.streamSong(ws, clientID, messageObj.session, messageObj.filename);
           break;
       default:
           this.handleError(ws, clientID, 'Message not supported');
       }
    }

    removeFromSession(clientID: string) {
        var sessionID: string = this.connections[clientID].session;

        if (sessionID) {
            var sessionMembers = this.sessions[sessionID].members
            sessionMembers = _.pull(sessionMembers, clientID);
            // Clean up stale sessions
            if (sessionMembers.length == 0) {
                delete this.sessions[sessionID];
            }
        }
    }

    newSession(ws: ws, clientID: string) {
        var session: string = shortid.generate();

        this.sessions[session] = {
            members: [clientID],
            song: '',
            currentChunk: 0
        };

        this.connections[clientID].session = session;
        ws.send(JSON.stringify({ message: 'new session', session: session}));
    }

    joinSession(ws: ws, clientID: string, session: string) {
        if (this.sessions[session]) {
            this.sessions[session].members.push(clientID);
            ws.send(JSON.stringify({ message: 'join session', session: session}));
            this.connections[clientID].session = session;
        } else {
            this.handleError(ws, clientID, 'Session does not exist')
        }
    }

    streamSong(ws: ws, clientID: string, session: string, songID: string) {
    }

    handleError(ws: ws, clientID: string, e: string) {
        ws.send(JSON.stringify({message: 'error', error: e}));
    }
}
