// Helper funciton for clamping a value between a min and max
fs = require('fs');
path = require('path');

function clamp(value, min, max) {
  return (value < min ? min : (value > max ? max : value));
}

var buildingSVG = fs.readFileSync(path.resolve(__dirname, 'building.svg'), 'utf8');

// Global variables
var playerCount = 0,
    players = [],
    PORT = 8080;

var objectList = [
    { item: "B1", boundPosition: "left", coordinate: 0 },
    { item: "B1", boundPosition: "right", coordinate: 306 },
    { item: "B2", boundPosition: "left", coordinate: 307 },
    { item: "B2", boundPosition: "right", coordinate: 613 },
    { item: "B3", boundPosition: "left", coordinate: 614 },
    { item: "B3", boundPosition: "right", coordinate: 920 },
    { item: "B4", boundPosition: "left", coordinate: 921 },
    { item: "B4", boundPosition: "right", coordinate: 1227 },
    { item: "B5", boundPosition: "left", coordinate: 1228 },
    { item: "B5", boundPosition: "right", coordinate: 1534 }
];

var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: PORT });

var svgWidth = 2000;
var svg;

function compare(a,b){
    if(a.coordinate < b.coordinate)
        return -1;
    if(a.coordinate > b.coordinate)
        return 1;
    return 0;
}

wss.on('connection', function(ws) {
  
  // Create our new player
  var player = {
       id: playerCount,
       x: Math.random() * 640,
       y: 500,
       size: 10,
       color: '#' + Math.floor(Math.random()*16777216).toString(16),
       ws: ws
    }

    // Send the new player their ID
    ws.send(JSON.stringify({type: 'your-id', id: player.id}));
	
    // Log the stuff
    ws.send(JSON.stringify({
        type: 'img',
        data: buildingSVG,
        svgWidth: svgWidth
    }));

    // Notify new player of existing playesrpiz
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

          case ('attack'):
              // Grab the appropriate player
              var tempObjectList = [
                    { item: "player " + message.id, boundPosition: "left", coordinate: (message.x - 20) },
                    { item: "player " + message.id, boundPosition: "right", coordinate: (message.x + 20) }].concat(objectList);
              tempObjectList = tempObjectList.sort(compare);
              for (var i = 1; i < tempObjectList.length-1; i+=2) {
                  if ((tempObjectList[i].item != tempObjectList[i - 1].item) && (tempObjectList[i].item != tempObjectList[i + 1].item))
                      console.log(tempObjectList[i].item + " was caught in an attack.");
              }
              
              break;
      }    
    });
});
