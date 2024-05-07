/*
  Created on 3/28/2024
  @ author: william
*/

const WebSocket = require('ws');
// used to process requests in protocol
const ServerOps = require('./serverops.js');

// generic game request class
class GameRequest {
    static REQT = {
        LGIN: "LGIN",   // will happen on connection
        JOIN: "JOIN",   // updating username
        LOUT: "LOUT",   // will happen on close
        MOVE: "MOVE",
        ROTA: "ROTA",
        ITEM: "ITEM",
        HITS: "HITS",    // attempt hit on client-side (naive implementation)  
        ATTK: "ATTK"    // broadcast player shooting 
    };

    constructor() {
        this._cmd = GameRequest.REQT.LGIN;
        this._data = {};     // key-value pairs that represent attributes   
    }

    reset() {
        this._cmd = GameRequest.REQT.LGIN;
        this._data = {};     // reset dict
    }

    setType(mtype) {
        // Check if the input status is a valid status
        if (Object.values(GameRequest.REQT).includes(mtype)) {
            this._cmd = mtype;
        } else {
            console.error("Invalid Request Type");
        }
    }

    setData(d) { this._data = d; }
    addKey(key, value) { this._data[key] = value; }

    getType() { return this._cmd; }
    getData() { return this._data; }
    getValue(key) { return this._data[key]; }

    // request / response relies on JSON format
    marshal() {
        let data_str = this.getType();
        data_str = data_str + JSON.stringify(this._data);
        return data_str;
    }

    // value is a JSON string that needs to be converted to dictionary
    unmarshal(value) {
        this.reset();
        if(value != "") {
            this._cmd = value.substring(0, 4);  // assume type is 4 bytes
            this._data = JSON.parse(value.substring(4));
        }
    }
}

// generic game response class
// ** has its own response types (different from req)
class GameResponse {
    static RESP = {
        SPWN: "SPWN",   // gives info to spawn player in map
        MOVE: "MOVE",   // broadcast movement of one player to everyone else
        ROTA: "ROTA",   // broadcast rotation of one player to everyone else
        GOOD: "GOOD",
        JOIN: "JOIN",   // for leaderboard purposes
        ERRM: "ERRM",
        EXIT: "EXIT",    // broadcast player left the game
        ENTR: "ENTR",    // broadcast player entered the game
        ITEM: "ITEM",
        HITS: "HITS",    // attempt hit on client-side (naive implementation)  
        ATTK: "ATTK"    // broadcast enemy shooting
    };

    constructor() {
        this._cmd = GameResponse.RESP.GOOD;
        this._data = {};     // key-value pairs that represent attributes   
    }

    reset() {
        this._cmd = GameResponse.RESP.GOOD;
        this._data = {};     // reset dict
    }

    setType(mtype) {
        // Check if the input status is a valid status
        if (Object.values(GameResponse.RESP).includes(mtype)) {
            this._cmd = mtype;
        } else {
            console.error("Invalid Request Type");
        }
    }

    setData(d) { this._data = d; }
    addKey(key, value) { this._data[key] = value; }

    getType() { return this._cmd; }
    getData() { return this._data; }
    getValue(key) { return this._data[key]; }

    // request / response relies on JSON format
    marshal() {
        let data_str = this.getType();
        data_str = data_str + JSON.stringify(this._data);
        return data_str;
    }

    // value is a JSON string that needs to be converted to dictionary
    unmarshal(value) {
        this.reset();
        console.log(typeof value);
        if(value != "") {
            this._cmd = value.substring(0, 4);
            this._data = JSON.parse(value.substring(4));
        }
    }   
}

// global supporting variable
let gameOps = new ServerOps.ServerOps();

class GameProtocol {
    // WebSocket deals with comm layer
    // Therefore, we don't need to worry about marshalling messages 
    // (i.e. conversion from string to binary -> send thru TCP)

    // uses WebSocket Server
    constructor(wss, ws) {
        this.wss = wss; // knows all clients in the session
        this.ws = ws;   // client-specific socket
        this.clientId = "";

        // DEFAULT: SENDING SPAWN RESPONSE BACK TO CLIENT UPON INITIALIZATION
        this.spawnOnConnection();

        // this will redirect to server ops 
        // and figure out appropiate response 
        ws.on('message', this.handleMessage.bind(this));
        
        ws.on('close', this.leaveOnDisconnection.bind(this));
    }

    handleMessage(message) {
        // convert message to string
        let requestJSON = message.toString('utf8');
        // console.log(requestJSON);
        // unpackage JSON into request object to process
        let request = new GameRequest();
        let response = new GameResponse();
        try {
            request.unmarshal(requestJSON);
            response = gameOps.process(request, response);
            if(response != null)
                this.broadcastMessage(response.marshal());    
        }  
        catch (error) {
            // ignore message if not in json format
            console.log(error);
        }
    }

    broadcastMessage(message) {
        this.wss.clients.forEach(function each(client) {
            if (client !== this.ws && client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          }, { ws: this.ws });
    }

    
    spawnOnConnection() {
        let login_req = new GameRequest();   // create standard login request for player
        login_req.setType("LGIN");
        let spawn_response = new GameResponse();
        spawn_response = gameOps.process(login_req, spawn_response);     // update server because of player login then return a valid response
        this.clientId = spawn_response.getValue("0");   // remember websocket client id just in case user disconnects
        let spawn_msg = spawn_response.marshal();
        this.ws.send(spawn_msg);

        var coordinates = spawn_response.getValue(spawn_response.getValue("0")).split(" ");
        let enter_response = new GameResponse();    // let other players know client entered the game
        enter_response.setType("ENTR");
        enter_response.setData({"PID" : spawn_response.getValue("0"), "LOC" : `${coordinates[0]} ${coordinates[1]}`})   // assume player spawns at center of map
        this.broadcastMessage(enter_response.marshal());
    }

    leaveOnDisconnection() {
        let logout_req = new GameRequest();
        logout_req.setType("LOUT");
        logout_req.setData({"PID" : this.clientId});
        let logout_response = new GameResponse();
        logout_response = gameOps.process(logout_req, logout_response);    // no response required upon disconnection
        this.broadcastMessage(logout_response.marshal());   // let other players know of disconnection
    }
}

module.exports = {GameProtocol, GameRequest, GameResponse};
