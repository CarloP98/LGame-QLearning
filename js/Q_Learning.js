var gamePieces = ["B","R","C"]; //BLUE, RED, COIN
var initialGameState = [gamePieces[2],gamePieces[1],gamePieces[1],""            ,
                        ""           ,gamePieces[0],gamePieces[1],""            ,
                        ""           ,gamePieces[0],gamePieces[1],""            ,
                        ""           ,gamePieces[0],gamePieces[0],gamePieces[2]];

class Environment{
	constructor(state){
		this.state = state;
	}

	playMove(playerId, move){
		let result = this.state.slice();
   		for(var i=0; i<this.state.length; i++){
   			if(this.state[i] == gamePieces[playerId])
	     		result[i] = "";
	     	if(this.state[i] == gamePieces[2] && move[1].length > 0)
       			result[i] = "";
   		}
   		for(var i=0; i<move[0].length; i++)
     		result[move[0][i]] = gamePieces[playerId];
		for(var i=0; i<move[1].length; i++)
     		result[move[1][i]] = gamePieces[2];
  		this.state = result;
  		return this.state;
	}
}

class Agent {
	constructor(playerId) {
  		this.playerId = playerId;
  		this.gamma = 0.8;
		this.epsilon = 0.1;
		this.experience = [];
  		this.model = new nn([[48], [10, "sigmoid"], [1]], "mse", 0.01)
  		this.model.parameters = trainedModel;
  	}

  	getBestMove(state){
  		let moves = this.getAvailableMoves(state)[1];
  		if(moves == null)
  			return null
		//EXPLORATION
		if(Math.random() <= this.epsilon) 
			return moves[Math.floor(Math.random() * moves.length)];
		//EXPLOITATION
		else{
			var bestMove = 0
			var bestScore = -1000
			for(var x=0; x<moves.length; x++){
				var newState = this.simulateMove(state, this.playerId, moves[x]);
	   			var score = this.model.predict([this.prepareInput(newState)])[0][0];
	   			if(score > bestScore){
	   				bestScore = score;
	   				bestMove = x;
	   			}
			}
			return moves[bestMove];
		}
	}

	simulateMove(state, player, move)
	{
		let result = state.slice();
   		for(var i=0; i<state.length; i++)
     		if(state[i] == gamePieces[player] || state[i] == gamePieces[2])
       			result[i] = "";
   		for(var i=0; i<move[0].length; i++)
     		result[move[0][i]] = gamePieces[player];
		for(var i=0; i<move[1].length; i++)
     		result[move[1][i]] = gamePieces[2];
  		return result;
	}
	
	getAvailableMoves(state){
    	var allMoves                = [];
    	var possibleMoves           = [];
    	var currentPosition         = [];
    	var currentCoinPosition     = [];
    	var currentOpponentPosition = [];
    	var opponentID = gamePieces[(this.playerId+1)%2];

    	for(var i=0; i<state.length; i++){
			if(state[i]      == gamePieces[this.playerId]) currentPosition.push(i);
      		else if(state[i] == gamePieces[2])             currentCoinPosition.push(i);
			else if(state[i] == gamePieces[opponentID])    currentOpponentPosition.push(i);
	 	}
	 	currentPosition.sort(function(a, b) {return a - b;});

    	for(var i=0; i<3; i++){
        	for(var j=0; j<2; j++){   
           		var o = i+(4*j);
           		allMoves.push([0+o,1+o,5+o,9+o]);
           		allMoves.push([0+o,4+o,8+o,9+o]);
           		allMoves.push([0+o,1+o,4+o,8+o]);
           		allMoves.push([1+o,5+o,8+o,9+o]);
           		o = j+(4*i);
           		allMoves.push([0+o,1+o,2+o,6+o]);
           		allMoves.push([0+o,4+o,5+o,6+o]);
           		allMoves.push([0+o,1+o,2+o,4+o]);
           		allMoves.push([2+o,4+o,5+o,6+o]);
        	}
        }
	 
    	for(var i=0; i<allMoves.length; i++){
    		if(JSON.stringify(allMoves[i]) == JSON.stringify(currentPosition))
	    		continue;	
    		var valid = true;
    		for(var j=0; j<allMoves[i].length; j++)
    			if(state[allMoves[i][j]] == opponentID || state[allMoves[i][j]] == gamePieces[2])
    				valid = false;
    		if(valid) possibleMoves.push(allMoves[i]);
    	}
    	var result = [];
		if(possibleMoves.length == 0) return [];

    	for(var x=0; x< possibleMoves.length; x++){
      		var tempGrid = this.simulateMove(state, this.playerId, [possibleMoves[x],currentCoinPosition]);
    		result.push([possibleMoves[x].slice(), currentCoinPosition.slice()]);
    		for(var y=0; y< 16; y++)
    			if(tempGrid[y] == "")
    				result.push([possibleMoves[x].slice(), [y,currentCoinPosition[1]]]);

    		for(var y=0; y< 16; y++)
    			if(tempGrid[y] == "")
    				result.push([possibleMoves[x].slice(), [currentCoinPosition[0],y]]);
	 	}
    	return[possibleMoves, result];
	}

	prepareInput(state){
		if(this.playerId==0)
			return state.map(function(item) { return item == '' ? [0,0,0] : (item == 'B' ? [1,0,0]: (item == 'R' ? [0,1,0]: [0,0,1]))}).flat();
		else
			return state.map(function(item) { return item == '' ? [0,0,0] : (item == 'R' ? [1,0,0]: (item == 'B' ? [0,1,0]: [0,0,1]))}).flat();
			
	}

	async train(state, nextState, reward){
		if(nextState == null)
			await this.model.train([this.prepareInput(state)], [[reward]]);
		else{
			var curr = this.model.predict([this.prepareInput(state)]);
			var next = this.model.predict([this.prepareInput(nextState)]);	
			var newVal = reward + this.gamma * next;
			await this.model.train([this.prepareInput(state)], [[newVal]]);	
		}
	}
}

async function train(GAMES, agents){
	environment = new Environment(initialGameState);
	var players = agents;

	for(var x=0; x<GAMES; x++)
	{
		var reward = 0
		var winner = null;
		var currentAgent = players[Math.round(Math.random())];
		var turns = 0
		environment.state = initialGameState;
		currentAgent.epsilon *= (1-(2/GAMES));
		
		while(1)
		{
			turns += 1;
			if(turns >= 1000)
				break;

			var state = environment.state; 
			var nextState = null;
			//find actions
			var action  = currentAgent.getBestMove(environment.state);
			//take action
			if(action != null){
         		nextState = environment.playMove(currentAgent.playerId, action);
         		await currentAgent.train(state, nextState, reward);
			} 
			else{
				await players[currentAgent.playerId].train(state, nextState, -1);
				await players[(currentAgent.playerId+1)%2].train(state, nextState, 1);
				break;
			}
	 		currentAgent = players[(currentAgent.playerId+1)%2];
	 		//printGrid(environment.state);
		}	

		winner = (turns < 1000)?(currentAgent.playerId+1)%2:"tie";	
		console.log("game: " + (x+1) + "    winner: " + winner + "   turns: " +  turns)
	}
}

function printGrid(grid)
{
	var str = "";
    for(var c=0; c<grid.length; c++)
    {
    	if(c%4 == 0) str +="\n";
    	if(grid[c] == "")
    		str += ("_" + "  ");
    	else
    		str += (grid[c] + "  ");
    }
	 str +="\n\n\n";
    console.log(str); 
}