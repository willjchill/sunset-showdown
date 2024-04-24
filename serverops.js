/*
  Created on 3/28/2024
  @ author: william
*/

// SAVE OUR DATABASE HERE FOR NOW
// PID=[LOC] [ROTA] [ITEM] ...
// every space -> new attribute to maintain Dictionary<string, string> data type
let gameState = {}  // contains player id and location of all players
let id_counter = 1;

class ServerOps {
    constructor() {
        this._route = {
            "MOVE" : this._doMove,
            "LGIN" : this._doLogin,
            "ROTA" : this._doRotate,
            "LOUT" : this._doLogout,
            "ITEM" : this._doItem
        }
    }

    // return a response after login
    _doLogin(request, response=null) {
        gameState[id_counter.toString()] = {"LOC" : "0 0", "ROT" : "0", "ITM" : "0"};
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
            id_counter += 1; 
        }
        return response;
    }

    // delete user from gamestate upon logout
    _doLogout(request, response=null) {
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
}

module.exports = { ServerOps };

