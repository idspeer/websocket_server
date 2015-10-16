(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * Module dependencies.
 */

var global = (function() { return this; })();

/**
 * WebSocket constructor.
 */

var WebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Module exports.
 */

module.exports = WebSocket ? ws : null;

/**
 * WebSocket constructor.
 *
 * The third `opts` options object gets ignored in web browsers, since it's
 * non-standard, and throws a TypeError if passed to the constructor.
 * See: https://github.com/einaros/ws/issues/227
 *
 * @param {String} uri
 * @param {Array} protocols (optional)
 * @param {Object) opts (optional)
 * @api public
 */

function ws(uri, protocols, opts) {
  var instance;
  if (protocols) {
    instance = new WebSocket(uri, protocols);
  } else {
    instance = new WebSocket(uri);
  }
  return instance;
}

if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],2:[function(require,module,exports){
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

  var worldSVG;
  var worldSVGSrc;
  var source = new Image();

  var xmlsLink = "http://www.w3.org/2000/svg";
  var svgWidth = 2000;
  var svgHeight = screen.height;
  var svgOffsetX = 0;
  var worldSVGView;
  
  // Set up the websocket client
  //ws = new WebSocket('ws://linux.cis.ksu.edu:' + PORT);
  ws = new WebSocket('ws://localhost:' + PORT);
  
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
	  case('world'):
		building = message.image;
		break;
        case ('img'):
            worldSVG = message.data;
          worldSVGView = "<svg width=\"" + svgWidth + "\" height=\"" + svgHeight + "\" viewBox=\"" + svgOffsetX + " 0 " + (640 + svgOffsetX) + " " + svgHeight + "\" preserveAspectRatio=\"xMinYMin meet\" xmlns=\""+xmlsLink+"\">\n" + message.data + "\n</svg>"
          worldSVGSrc = 'data:image/svg+xml;base64,' + window.btoa(worldSVGView);
          source.src = worldSVGSrc;
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
           // updateViewBox(-1);
            event.preventDefault();
            ws.send(JSON.stringify({
              type: "move", 
              id: myId, 
              x: -1, 
              y: 0
        }));
        break;
      //case 38: // up
      //  event.preventDefault();
      //  ws.send(JSON.stringify({
      //    type: "move", 
      //    id: myId, 
      //    x: 0, 
      //    y: -1
      //  }));
      //  break;
        case 39: // right
           // updateViewBox(1);
        event.preventDefault();
        ws.send(JSON.stringify({
          type: "move", 
          id: myId, 
          x: 1, 
          y: 0
        }));
        break;
      //case 40: // down
      //  event.preventDefault();
      //  ws.send(JSON.stringify({
      //    type: "move", 
      //    id: myId, 
      //    x: 0, 
      //    y: 1
      //  }));
      //  break;
    }
  }

  screen.onclick = function(event) {
      event.preventDefault();
      ws.send(JSON.stringify({
          type: "attack", 
          id: myId, 
          x: event.clientX, 
          y: event.clientY
      }));
  }
  
  function updateViewBox(xChange) {
      if ((xChange > 0 && svgOffsetX < (1360)) || (xChange < 0 && svgOffsetX > 0)) {
          svgOffsetX += xChange;
          worldSVGView = "<svg width=\"" + svgWidth + "\" height=\"" + svgHeight + "\" viewBox=\"" + svgOffsetX + " 0 " + (640 + svgOffsetX) + " " + svgHeight + "\" preserveAspectRatio=\"none\">" + worldSVG + "</svg>"
          worldSVGSrc = 'data:image/svg+xml;base64,' + window.btoa(worldSVGView);
          source.src = worldSVGSrc;
      }
  }

  // Render 
  function render(ctx) {
      ctx.clearRect(0, 0, 640, 640);
      ctx.fillStyle = "#d3d3d3";
      ctx.fillRect(0, 406, 2000, 506);
      ctx.fillStyle = "ffffff";
      ctx.drawImage(source, 0, 0);
    players.forEach( function(player) {
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.fillRect(player.x, player.y, player.size, player.size*1.27);
      ctx.fill();
    });
  }    
  
};
},{"ws":1}]},{},[2]);
