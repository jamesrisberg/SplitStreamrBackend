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
           this.streamSong(ws, clientID, messageObj.session, messageObj.songID);
           break;
       default:
           this.handleError(ws, clientID, 'Message not supported');

           console.log(clientID, 'message "' + messageObj.message + '" is unsupported.');
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
                song: '',
                leader: clientID,
                currentChunk: 0
            };

            this.connections[clientID].session = sessionID;

            // Send response
            ws.send(JSON.stringify({ message: 'new session', session: sessionID}));

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
                ws.send(JSON.stringify({ message: 'join session', session: sessionID}));

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

    streamSong(ws: ws, clientID: string, sessionID: string, songID: string) {}

    handleError(ws: ws, clientID: string, e: string) {
        // Send response
        ws.send(JSON.stringify({message: 'error', error: e}));
    }
}

export = WebSocketHandler;
