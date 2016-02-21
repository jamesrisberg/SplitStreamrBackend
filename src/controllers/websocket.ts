/// <reference path="../../typings/main.d.ts"/>

import ws = require('ws');
import fs = require('fs');
import q = require('q');
import shortid = require('shortid');
import _ = require('lodash');
import Song = require('../models/song');
import ISong = require('../interfaces/song');

interface IConnection {
    ws: ws,
    session: string
}

interface ISession {
    members: string[],
    song: ISong,
    leader: string,
    currentChunk: number,
    readStream: fs.ReadStream
}

interface IMessage {
    message: string,
    session?: string,
    song?: string
}

class WebSocketHandler {
    private sessions: { [key:string]: ISession };
    private connections: { [key:string]: IConnection };

    constructor(private wss: ws.Server) {
        this.setupServer();
        this.sessions = {};
        this.connections = {};
    };

    setupServer() {
        this.wss.on('connection', ws => {
            var clientID = shortid.generate();

            console.log('New connection. Assigned ID:', clientID);

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
                console.log(clientID, 'left.');
                // Cleanup sessions and connections
                this.removeFromSession(clientID);
                delete this.connections[clientID];
            });
        });
    }

    handleNewMessage(ws: ws, clientID: string, messageObj: IMessage) {
        console.log(clientID, 'sent a message:', messageObj.message + '.');

        switch(messageObj.message) {
        case 'new session':
            this.newSession(ws, clientID);
            break;
        case 'join session':
            this.joinSession(ws, clientID, messageObj.session);
            break;
        case 'stream song':
            this.streamSong(ws, clientID, messageObj.session, messageObj.song);
            break;
        case 'chunk received':
            this.sendChunk(ws, clientID, messageObj.session);
            break;
        default:
            this.handleError(ws, clientID, 'Message not supported');

            console.log(clientID, 'message "' + messageObj.message + '" is unsupported.');
        }
    }

    sendTextMessage(ws: ws, data) {
        console.log('MESSAGE DATA:', data);
        ws.send(JSON.stringify(data));
    }

    sendBinaryMessage(ws: ws, data) {
        if (data) {
            console.log('BINARY MESSAGE DATA:', data.toString('base64').substring(0,32) + '...')
            ws.send(data, {binary: true, mask: false});
        } else {
            console.log('NO DATA');
        }
    }

    removeFromSession(clientID: string) {
        if (this.connections[clientID]) {
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
    }

    cleanupSessionMembers(sessionID: string) {
        var sessionMembers = this.sessions[sessionID].members;

        _.forEach(sessionMembers, (memberClientID) => {
            this.connections[memberClientID].ws.close();
            this.connections[memberClientID] = undefined;
        });
    }

    newSession(ws: ws, clientID: string) {
        console.log(clientID, 'requested a new session.');

        var existingSessionID: string = this.connections[clientID].session;

        if (existingSessionID) {
            this.handleError(ws, clientID, 'Client already part of a session');

            console.log(clientID, 'failed to create a new session.');
        } else {
            var sessionID: string = shortid.generate();

            // Create a new session
            this.sessions[sessionID] = {
                members: [clientID],
                song: undefined,
                leader: clientID,
                currentChunk: 0,
                readStream: undefined
            };

            this.connections[clientID].session = sessionID;

            // Send response
            this.sendTextMessage(ws, { message: 'new session', session: sessionID });

            console.log(clientID, 'created a new session:', sessionID + '.');
        }
    }

    joinSession(ws: ws, clientID: string, sessionID: string) {
        console.log(clientID, 'requested to join session:', sessionID + '.');

        if (this.sessions[sessionID]) {
            // If the user does not already have a session, then join
            if (!this.connections[clientID].session) {
                var sessionMembers = this.sessions[sessionID].members;
                sessionMembers.push(clientID);

                this.connections[clientID].session = sessionID;

                // Send response
                this.sendTextMessage(ws, { message: 'join session', session: sessionID});

                console.log(clientID, 'joined session:', sessionID, '.');
            } else {
                this.handleError(ws, clientID, 'Client already part of a session');

                console.log(clientID, 'failed to join session:', sessionID + '. Already part of session.');
            }
        } else {
            this.handleError(ws, clientID, 'Session does not exist');

            console.log(clientID, 'failed to join session:', sessionID + '. Does not exist.');
        }
    }

    streamSong(ws: ws, clientID: string, sessionID: string, songID: string) {
        Song
            .findOne({_id: songID})
            .exec((err, song) => {
                if (err)
                    this.handleError(ws, clientID, err);
                else if (!song)
                    this.handleError(ws, clientID, 'Song does not exist or wrong ID.')
                else {
                    this.sendInitialChunks(ws, clientID, sessionID, song);
                }
            })
    }

    sendInitialChunks(ws: ws, clientID: string , sessionID: string, song: ISong) {
        var session = this.sessions[sessionID];
        if (session) {
            session.song = song;
            session.currentChunk = 0;
            session.readStream = fs.createReadStream(song.path);
            session.readStream.on('readable', () => {
                session.readStream.read(1);
                session.members.forEach((member) => {
                    if (session.currentChunk < session.song.numberOfChunks) {
                        var memberSocket = this.connections[member].ws;
                        this.sendSingleChunk(memberSocket, session);
                    }
                });
            })
        } else {
            this.handleError(ws, clientID, 'Session does not exist');
        }
    }

    sendChunk(ws: ws, clientID: string, sessionID: string) {
        var session = this.sessions[sessionID];
        if (session) {
            if (session.currentChunk < session.song.numberOfChunks) {
                this.sendSingleChunk(ws, session);
            }
        } else {
            this.handleError(ws, clientID, 'Session does not exist');
        }
    }

    sendSingleChunk(ws: ws, session: ISession)  {
        console.log('Sending chunk #', session.currentChunk + '.');

        this.sendTextMessage(ws, {
            message: 'chunk number',
            chunk: session.currentChunk++,
            song: session.song._id
        });
        this.sendBinaryMessage(ws, session.readStream.read(session.song.fixedChunkSize));
    }

    handleError(ws: ws, clientID: string, e: string) {
        // Send response
        this.sendTextMessage(ws, { message: 'error', error: e });
    }
}

export = WebSocketHandler;
