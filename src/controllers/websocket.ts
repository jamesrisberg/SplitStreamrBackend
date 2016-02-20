/// <reference path="../../typings/main.d.ts"/>

import ws = require('ws');
import shortid = require('shortid');
import _ = require('lodash');

interface IConnection {
    ws: ws,
    session: string
}

interface ISession {
    members: string[],
    song: string,
    leader: string,
    currentChunk: number
}

interface IMessage {
    message: string,
    session?: string,
    songID?: string
}

export class WebSocketHandler {
    private sessions: { [key:string]: ISession };
    private connections: { [key:string]: IConnection };

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

    handleNewMessage(ws: ws, clientID: string, messageObj: IMessage) {
       switch(messageObj.message) {
       case 'new session':
           this.newSession(ws, clientID);
           break;
       case 'join session':
           this.joinSession(ws, clientID, messageObj.session);
           break;
       case 'stream song':
           this.streamSong(ws, clientID, messageObj.session, messageObj.songID);
           break;
       default:
           this.handleError(ws, clientID, 'Message not supported');
       }
    }

    removeFromSession(clientID: string) {
        var sessionID: string = this.connections[clientID].session;

        if (sessionID) {
            var session: ISession = this.sessions[sessionID];
            var sessionMembers = session.members;

            // Remove user from session's list of members
            sessionMembers = _.pull(sessionMembers, clientID);

            // Clean up stale sessions
            if (sessionMembers.length == 0) {
                session = undefined;
            } else if (session.leader == clientID) {
                // Kick everyone from the channel
                this.cleanupSessionMembers(sessionID);
                session = undefined;
            }
        }
    }

    cleanupSessionMembers(sessionID: string) {
        var sessionMembers = this.sessions[sessionID].members;

         _.forEach(sessionMembers, (memberClientID) => {
             this.connections[memberClientID].ws.close();
             this.connections[memberClientID] = undefined;
         });
    }

    newSession(ws: ws, clientID: string) {
        var existingSessionID: string = this.connections[clientID].session;
        var sessionID: string = shortid.generate();

        // Create a new session
        this.sessions[sessionID] = {
            members: [clientID],
            song: '',
            leader: clientID,
            currentChunk: 0
        };

        // Delete or leave already existing session
        if (existingSessionID) {
            var existingSession: ISession = this.sessions[existingSessionID];

            _.pull(existingSession.members, clientID);
            if (existingSession.leader == clientID) {
                this.cleanupSessionMembers(existingSessionID);
                existingSession = undefined;
            }
        }

        this.connections[clientID].session = sessionID;
        ws.send(JSON.stringify({ message: 'new session', session: sessionID}));
    }

    joinSession(ws: ws, clientID: string, sessionID: string) {
        if (this.sessions[sessionID]) {
            this.sessions[sessionID].members.push(clientID);
            this.connections[clientID].session = sessionID;
            ws.send(JSON.stringify({ message: 'join session', session: sessionID}));
        } else {
            this.handleError(ws, clientID, 'Session does not exist')
        }
    }

    streamSong(ws: ws, clientID: string, sessionID: string, songID: string) {
        
    }

    handleError(ws: ws, clientID: string, e: string) {
        ws.send(JSON.stringify({message: 'error', error: e}));
    }
}
