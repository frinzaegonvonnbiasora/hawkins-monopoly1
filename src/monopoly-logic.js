/**
 * MONOPOLY GAME LOGIC SYSTEM (Single Player)
 * 
 * This script implements the core logic for a Monopoly-style game.
 * It handles player state, board movement, tile interactions, and property ownership.
 */

// --- 1. GAME STATE & DATA STRUCTURES ---

/**
 * Represents a tile on the board.
 */
class Tile {
  constructor(name, type, price = 0, rent = 0) {
    this.name = name;
    this.type = type; // 'GO', 'PROPERTY', 'TAX', 'JAIL', 'GO_TO_JAIL', 'FREE_PARKING'
    this.price = price;
    this.rent = rent;
    this.owner = null;
  }
}

/**
 * Represents the player.
 */
class Player {
  constructor(name) {
    this.name = name;
    this.money = 1500;
    this.position = 0;
    this.properties = [];
    this.inJail = false;
  }
}

// --- 2. BOARD INITIALIZATION ---

const createBoard = () => {
  const board = [];
  
  // Index 0: GO
  board.push(new Tile("GO", "GO"));
  
  // Fill the rest of the 40 tiles with a mix of properties, taxes, and special tiles
  for (let i = 1; i < 40; i++) {
    if (i === 10) {
      board.push(new Tile("JAIL", "JAIL"));
    } else if (i === 20) {
      board.push(new Tile("FREE PARKING", "FREE_PARKING"));
    } else if (i === 30) {
      board.push(new Tile("GO TO JAIL", "GO_TO_JAIL"));
    } else if (i === 4 || i === 38) {
      board.push(new Tile(i === 4 ? "INCOME TAX" : "LUXURY TAX", "TAX", 200));
    } else {
      // Generic Property
      const price = 60 + (i * 10);
      const rent = Math.floor(price * 0.1);
      board.push(new Tile(`Property ${i}`, "PROPERTY", price, rent));
    }
  }
  
  return board;
};

const board = createBoard();
const player = new Player("Eleven");

// --- 3. CORE FUNCTIONS ---

/**
 * Returns a random number from 2 to 12 (simulating two 6-sided dice).
 */
const rollDice = () => {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return d1 + d2;
};

/**
 * Moves the player forward and handles passing GO.
 */
const movePlayer = (player, steps) => {
  console.log(`\n--- ${player.name}'s Turn ---`);
  console.log(`Current Position: ${player.position} (${board[player.position].name})`);
  console.log(`Rolled: ${steps}`);

  const oldPosition = player.position;
  player.position = (player.position + steps) % 40;

  // Check if player passed GO (index 0)
  if (player.position < oldPosition) {
    player.money += 200;
    console.log("Passed GO! Collected $200.");
  }

  console.log(`New Position: ${player.position} (${board[player.position].name})`);
};

/**
 * Handles the logic for the tile the player landed on.
 */
const handleTile = (player, tile) => {
  switch (tile.type) {
    case "PROPERTY":
      if (tile.owner === null) {
        // Unowned: Try to buy
        if (player.money >= tile.price) {
          player.money -= tile.price;
          tile.owner = player;
          player.properties.push(tile);
          console.log(`Purchased ${tile.name} for $${tile.price}. Remaining Money: $${player.money}`);
        } else {
          console.log(`Not enough money to buy ${tile.name}. (Price: $${tile.price}, Balance: $${player.money})`);
        }
      } else if (tile.owner !== player) {
        // Owned by someone else: Pay rent
        player.money -= tile.rent;
        tile.owner.money += tile.rent; // In single player, this just goes to the "bank" or ghost owner
        console.log(`Landed on ${tile.name} owned by ${tile.owner.name}. Paid $${tile.rent} rent. Remaining Money: $${player.money}`);
      } else {
        console.log(`You already own ${tile.name}. Welcome home!`);
      }
      break;

    case "TAX":
      player.money -= tile.price;
      console.log(`Paid $${tile.price} in ${tile.name}. Remaining Money: $${player.money}`);
      break;

    case "GO_TO_JAIL":
      player.position = 10;
      player.inJail = true;
      console.log("Busted! Sent directly to JAIL.");
      break;

    case "GO":
      // Reward already handled in movePlayer (passing GO), but landing exactly on it could have extra logic
      console.log("Landed exactly on GO! Feeling lucky.");
      break;

    default:
      console.log(`Landed on ${tile.name}. Nothing happens.`);
      break;
  }
};

// --- 4. GAME LOOP SIMULATION ---

const simulateGame = (turns = 10) => {
  console.log("Starting Monopoly Simulation...");
  console.log(`Initial State: ${player.name} has $${player.money}`);

  for (let i = 1; i <= turns; i++) {
    console.log(`\n=== TURN ${i} ===`);
    
    if (player.money <= 0) {
      console.log("GAME OVER: Player is bankrupt!");
      break;
    }

    const steps = rollDice();
    movePlayer(player, steps);
    
    const currentTile = board[player.position];
    handleTile(player, currentTile);
  }

  console.log("\n--- Simulation Summary ---");
  console.log(`Final Money: $${player.money}`);
  console.log(`Properties Owned: ${player.properties.map(p => p.name).join(", ") || "None"}`);
};

// Run the simulation
// simulateGame(15);
