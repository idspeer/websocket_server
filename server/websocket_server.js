// Helper funciton for clamping a value between a min and max
function clamp(value, min, max) {
  return (value < min ? min : (value > max ? max : value));
}

// Global variables
var playerCount = 0,
    players = [],
    PORT = 8080;

var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: PORT});

function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    var dataURL = canvas.toDataUrl("image/svg");
    return dataURL;
}

function sendImage() {
    var img = getBase64Image(document.getElementById("building.svg"));
    var JSONimg = {
        'type': 'img',
        'data': img,
    }
    ws.send(JSON.stringify(JSONimg));
}

wss.on('connection', function(ws) {
  
  // Create our new player
  var player = {
       id: playerCount,
       x: Math.random() * 640,
       y: Math.random() * 640,
       size: 8,
       color: '#' + Math.floor(Math.random()*16777216).toString(16),
       ws: ws
    }

    // Send the new player their ID
    ws.send(JSON.stringify({type: 'your-id', id: player.id}));
	
	// Send the new player the current World SVG
	sendImage();
    
    // Notify new player of existing players
    players.forEach( function(existingPlayer) {
      ws.send(JSON.stringify({
        type: 'player-joined',
        id: existingPlayer.id,
        x: existingPlayer.x,
        y: existingPlayer.y,
        size: existingPlayer.size,
        color: existingPlayer.color
      }));
    });
    
    // Add the new player to the player list
    players[playerCount] = player;          
    playerCount++;

    // Notify everyone of the new player
    players.forEach( function(existingPlayer) {
      existingPlayer.ws.send(JSON.stringify({
        type:'player-joined', 
        id: player.id,
        x: player.x,
        y: player.y,
        size: player.size,
        color: player.color
      }));
    });
    
    // Handle the websocket closing event
    ws.on('close', function() {
      // Remove the player from our game state
      players.splice(players.indexOf(player), 1);
      
      // Notify remaining players that this player left
      players.forEach( function(remainingPlayer) {
        remainingPlayer.ws.send(JSON.stringify({
          type: 'player-left',
          id: player.id
        }));
      });
    });

    // Handle websocket messages
    ws.on('message', function(json) {
      var message = JSON.parse(json);
      console.log('received: %s', message.type);

      // Handle messages by type
      switch(message.type) {

        case('move'):
          // Grab the appropriate player
          var player = players[message.id];

          // Move the player
          player.x += clamp(message.x, -1, 1);
          player.y += clamp(message.y, -1, 1);

          // Notify everyone of the new state
          players.forEach( function (recipient) {
            recipient.ws.send(JSON.stringify({
              type:'player-moved', 
              id: player.id,
              x: player.x,
              y: player.y
            }));
          });
          break;
      }    
    });
});
