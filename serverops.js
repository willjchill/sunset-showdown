/*
  Created on 3/28/2024
  @ author: william
*/

// SAVE OUR DATABASE HERE FOR NOW
// PID=[LOC] [ROTA] [ITEM] [SCORE] ...
// every space -> new attribute to maintain Dictionary<string, string> data type
let gameState = {}  // contains player id and location of all players + score
let leaderboard = {}    // contains top 3 players
let id_counter = 1;

class ServerOps {
    constructor() {
        this._route = {
            "MOVE" : this._doMove,
            "LGIN" : this._doLogin,
            "ROTA" : this._doRotate,
            "LOUT" : this._doLogout,
            "ITEM" : this._doItem,
            "ATTK" : this._doAttack,
            "HITS" : this._doHits,
            "JOIN" : this._doJoin
        }
    }

    // update leaderboard AFTER login
    _doJoin(request, response=null) {
        let request_data = request.getData();
        username = request_data["UID"];
        gameState[request_data["PID"]][username] = 0;  // default score 0   
        if(response != null) {
            response.setType("JOIN");   // broadcast updated leaderboard
            response.setData(request_data);
        }
        return response
    }

    // return a response after login
    _doLogin(request, response=null) {
        gameState[id_counter.toString()] = {"LOC" : "-4.38 -1.61", "ROT" : "0", "ITM" : "0"};
        console.log(gameState);
        if(response != null) {
            response.setType("SPWN");
            let gameState_data = Object.assign({}, gameState);  // copy dictionary data without passing reference
            let gameState_string = {};
            for (var key in gameState_data) {
                gameState_string[key] = "";
                for(var subKey in gameState_data[key]) {
                    gameState_string[key] += gameState_data[key][subKey];
                    gameState_string[key] += " ";
                }
            }
            console.log(gameState_string);
            response.setData(gameState_string);  // inform user about current game state when spawning
            response.addKey("0", id_counter.toString());    // informing player of their assigned player id
            console.log(`Player ${id_counter} has connected.`);
            id_counter += 1; 
        }
        return response;
    }

    // delete user from gamestate upon logout
    _doLogout(request, response=null) {
        console.log(`Player ${request.getValue("PID")} has disconnected.`);
        delete gameState[request.getValue("PID")]; // delete based on playerid
        if(response != null) {
            response.setType("EXIT");
            response.setData({"PID" : request.getValue("PID")});
        }
        return response;
    }

    _doMove(request, response=null) {
        let request_data = request.getData();
        gameState[request_data["PID"]]["LOC"] = request_data["LOC"];  
        if(response != null) {
            response.setType("MOVE");
            response.setData(request_data);
        }
        return response
    }

    process(request, response=null) {
        let operation = this._route[request.getType()]
        return operation(request, response)   // returns response (if any)
    }

    _doRotate(request, response=null) {
        let request_data = request.getData();
        if(request_data["PID"] != "0") {
            gameState[request_data["PID"]]["ROT"] = request_data["ROT"];  // sub key for each player
            if(response != null) {
                response.setType("ROTA");
                response.setData(request_data);
            }
            return response;
        }
        return null;
    }

    _doItem(request, response=null) {
        let request_data = request.getData();
        if(response != null) {
            gameState[request_data["PID"]]["ITM"] = request_data["ITM"];  // sub key for each player
            response.setType("ITEM");
            response.setData(request_data); // request data is player id so everyone knows 
        }
        return response;
    }

    _doAttack(request, response=null) {
        let request_data = request.getData();
        if(response != null) {
            response.setType("ATTK");
            response.setData(request_data); 
        }
        return response;
    }

    _doHits(request, response=null) {
        let request_data = request.getData();
        if(response != null) {
            response.setType("HITS");
            response.setData(request_data); 
        }
        return response;     
    }
}

module.exports = { ServerOps };

