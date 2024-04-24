/*
  Created on 3/28/2024
  @ author: william
*/

// imports
const WebSocket = require('ws');
const GameProtocol = require('./gameprotocol.js')

if (require.main === module) {
  // create websocket
  // relies on TCP + HTTP Protocol
  const wss = new WebSocket.Server({ port: 5555 });

  // listening
  wss.on('connection', function connection(ws) {
    // DEFAULT: ON CONNECTION WE SEND A SPAWN RESPONSE FOR THE CLIENT (contained in constructor of gameprotocol)
    // run server operations on new socket
    gProto = new GameProtocol.GameProtocol(wss, ws) // create protocol based on comm socket
    // server operations used by protocol
  });

  console.log('WebSocket server started on ws://localhost:5555');
}

