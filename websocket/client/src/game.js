var WebSocket = require('ws'),
    PORT = 8080;

// Wait for the window to load completely
window.onload = function() {
   
  // Players
  var myId,
    players = [];
  
  // Set up the screen canvas
  var screen = document.createElement("canvas");
  screen.width = 640;
  screen.height = 640;
  screenCtx = screen.getContext("2d");
  document.getElementById("game-screen-container").appendChild(screen);
  
  // Set up the websocket client
  ws = new WebSocket('ws://linux.cis.ksu.edu:' + PORT);
  
  // Handler for websocket messages
  ws.onmessage = function(msg) {
    var message = JSON.parse(msg.data);
    
    switch(message.type) {
      case('your-id'):
        myId = message.id;
        break;
      case('player-joined'):
        // When a new player joins, add them to the player array
        players[message.id] = {
          x: message.x,
          y: message.y,
          size: message.size,
          color: message.color
        };
        break;
      case('player-moved'):
        // When a player has moved, store their new position
        players[message.id].x = message.x;
        players[message.id].y = message.y;
        break;
      case('player-left'):
        // When a player leaves, remove them from the player array
        players.splice(players.indexOf(players[message.id]));
        break;
    }
    // re-render the game world after any websocket message,
    // as they each change the state of the world
    render(screenCtx);
  }

  // Event handler for key events
  window.onkeydown = function(event) {
    switch(event.keyCode) {
      case 37: // left 
        event.preventDefault();
        ws.send(JSON.stringify({
          type: "move", 
          id: myId, 
          x: -1, 
          y: 0
        }));
        break;
      case 38: // up
        event.preventDefault();
        ws.send(JSON.stringify({
          type: "move", 
          id: myId, 
          x: 0, 
          y: -1
        }));
        break;
      case 39: // right
        event.preventDefault();
        ws.send(JSON.stringify({
          type: "move", 
          id: myId, 
          x: 1, 
          y: 0
        }));
        break;
      case 40: // down
        event.preventDefault();
        ws.send(JSON.stringify({
          type: "move", 
          id: myId, 
          x: 0, 
          y: 1
        }));
        break;
    }
  }
  
  // Render 
  function render(ctx) {
    ctx.clearRect(0, 0, 640, 640);
    players.forEach( function(player) {
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.size, 0, 2*Math.PI);
      ctx.fill();
    });
  }    
  
};