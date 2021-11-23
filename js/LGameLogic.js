class Board{
    constructor(name){
        this.env = new Environment(initialGameState);
        this.playerNames = ["BLUE", "RED"]
        this.players = [new Agent(0), new Agent(1)];
        this.player = this.players[0];
        this.againstAI = true;
        this.move = [];
        this.gameContainer = document.querySelector(name);
        this.gameContainer.insertAdjacentHTML('beforeend','<h2 id="status"></h2>\
                                                           <div class="play-area"></div><br>\
                                                           <center>\
                                                                <button id="skipBtn" hidden>SKIP</button>\
                                                                <button id="resetBtn">RESET</button>\
                                                            </center>');
        this.board_container = this.gameContainer.querySelector(".play-area");
        this.gameContainer.querySelector("#skipBtn").addEventListener("click", this.skip.bind(this));
        this.gameContainer.querySelector("#resetBtn").addEventListener("click", this.reset.bind(this));
        this.gameContainer.querySelector("#status").innerHTML = this.playerNames[this.player.playerId] +"'s turn - move L";
        this.renderBoard();
    }

    reset(){
        this.env = new Environment(initialGameState);
        this.player = this.players[0];
        this.move = [];
        this.renderBoard();
        this.gameContainer.querySelector("#status").innerHTML = this.playerNames[this.player.playerId] +"'s turn - move L";
    }

    performeMove() {
        this.move.sort(function(a, b) {return a - b;});
        if(this.move.length == 4 && JSON.stringify(this.player.getAvailableMoves(this.env.state)[0]).includes(JSON.stringify(this.move))){
            this.env.playMove(this.player.playerId, [this.move, []]);
            this.gameContainer.querySelector("#status").innerHTML = this.playerNames[this.player.playerId] +"'s turn - move coin or skip";
            this.gameContainer.querySelector("#skipBtn").hidden = false;
            this.chooseCoin();
        }
        else
            this.renderBoard();
       this.move = [];
    }

    buildMove(event) {
        var id = parseInt(event.target.id.substring(6)); 
        if(event.type == "mousedown")
        {
            this.move = [id];
            event.target.style.background = 'rgb(100,100,100)';
        }
        else if(event.type == "mouseover" && event.buttons == 1){
             if(this.move.length > 0 && this.move.length < 4){
                this.move.push(id);
                event.target.style.background = 'rgb(100,100,100)';
            }     
        }
        else if(event.type == "mouseup")
        {
            this.performeMove();
        }
    }

    renderBoard(){
        this.board_container.innerHTML = "";
        for (var i = 0; i < this.env.state.length; i++){
            if (this.env.state[i] == "B") this.board_container.insertAdjacentHTML('beforeend', '<div class="block" id="block_'+i+'"  style="background: rgb(69,107,214)"  ondragstart="return false;"></div>');
            else if (this.env.state[i] == "R") this.board_container.insertAdjacentHTML('beforeend', '<div class="block" id="block_'+i+'"  style="background: rgb(214,100,69)"  ondragstart="return false;"></div>');
            else if (this.env.state[i] == "C") this.board_container.insertAdjacentHTML('beforeend','<div class="block" id="block_'+i+'"  style="background: rgba(238,238,238,0.5)" ondragstart="return false;">\
                                                                                                        <span class="coin" style="background-color: rgb(173,255,47); pointer-events: none;"></span>\
                                                                                                    </div>');
            else this.board_container.insertAdjacentHTML('beforeend','<div class="block" id="block_'+i+'"  style="background: rgba(238,238,238,0.5)" ondragstart="return false;"></div>');
            this.board_container.querySelector("#block_"+i).addEventListener("mousedown", this.buildMove.bind(this));
            this.board_container.querySelector("#block_"+i).addEventListener("mouseover", this.buildMove.bind(this));
            this.board_container.querySelector("#block_"+i).addEventListener("mouseup", this.buildMove.bind(this));
        }
    };

    chooseCoin() {
        this.board_container.innerHTML = "";
        for (var i = 0; i < this.env.state.length; i++)
            if      (this.env.state[i] == "B") this.board_container.insertAdjacentHTML('beforeend', '<div class="block" id="block_' + i + '"  style="background: rgb(69,107,214)" ondragstart="return false;"></div>');
            else if (this.env.state[i] == "R") this.board_container.insertAdjacentHTML('beforeend', '<div class="block" id="block_' + i + '"  style="background: rgb(214,100,69)" ondragstart="return false;"></div>');
            else if (this.env.state[i] == "C"){
                this.board_container.insertAdjacentHTML('beforeend', '<div class="block" id="block_' + i + '"  style="background: rgba(238,238,238,0.5)" draggable="true">\
                                                                        <span class="coin"  style="background-color: rgb(173,255,47); pointer-events: none;"></span\
                                                                      </div>');
                this.board_container.querySelector("#block_"+i).addEventListener("dragstart", function(event){event.dataTransfer.setData("blockId", event.target.id)});
            }
            else{
                this.board_container.insertAdjacentHTML('beforeend', '<div class="block" id="block_' + i + '"  style="background: rgba(238,238,238,0.5)" ondragover="event.preventDefault()" ondragstart="return false;"></div>');
                this.board_container.querySelector("#block_"+i).addEventListener("drop", this.drop.bind(this));
            }
    }

    async drop(ev) {
        ev.preventDefault();
        var fromId = parseInt(ev.dataTransfer.getData("blockId").substring(6));
        var toId = parseInt(event.target.id.substring(6));
        this.env.state[fromId] = "";
        this.env.state[toId] = "C";
        this.renderBoard();
        await new Promise(resolve => setTimeout(resolve, 200));
        this.skip();
    }

    skip()
    {
        this.gameContainer.querySelector("#skipBtn").hidden = true;
        this.player = this.players[(this.player.playerId+1)%2];
        var chosenMove = this.player.getBestMove(this.env.state);
        if(!chosenMove)
            this.gameContainer.querySelector("#status").innerHTML = this.playerNames[(this.player.playerId+1)%2] +" won";
        else
        {
            if(this.againstAI){
                this.env.playMove(this.player.playerId, chosenMove);
                this.player = this.players[(this.player.playerId+1)%2];
                if(this.player.getBestMove(this.env.state) == null)
                    this.gameContainer.querySelector("#status").innerHTML = this.playerNames[(this.player.playerId+1)%2] +" won";
            }
            else
                this.gameContainer.querySelector("#status").innerHTML = this.playerNames[this.player.playerId] +"'s turn - move L";
        }
        this.renderBoard()
    }
}

var board = new Board("#gameArea1");