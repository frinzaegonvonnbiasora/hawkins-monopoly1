/**
 * Simple Monopoly Game Logic
 * Console-based only
 */

class Tile {
    constructor(name, type, price = 0, rent = 0) {
        this.name = name;
        this.type = type; // 'GO', 'Property', 'Tax', 'Jail', 'GoToJail'
        this.price = price;
        this.rent = rent;
        this.owner = null;
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.money = 1500;
        this.position = 0;
        this.properties = [];
    }
}

class MonopolyGame {
    constructor() {
        this.board = this.createBoard();
        this.player = new Player("Player 1");
    }

    createBoard() {
        return [
            new Tile("GO", "GO"),
            new Tile("Old Kent Road", "Property", 60, 2),
            new Tile("Income Tax", "Tax", 200),
            new Tile("Whitechapel Road", "Property", 60, 4),
            new Tile("Jail", "Jail"),
            new Tile("The Angel Islington", "Property", 100, 6),
            new Tile("Euston Road", "Property", 100, 6),
            new Tile("Pentonville Road", "Property", 120, 8),
            new Tile("Go to Jail", "GoToJail"),
            new Tile("Pall Mall", "Property", 140, 10),
            new Tile("Super Tax", "Tax", 100),
            new Tile("Whitehall", "Property", 140, 10),
        ];
    }

    rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    movePlayer(player, steps) {
        const oldPosition = player.position;
        player.position = (player.position + steps) % this.board.length;
        
        console.log(`${player.name} rolled ${steps} and moved from ${oldPosition} to ${player.position} (${this.board[player.position].name})`);

        // If player passes GO, add 200 money
        if (player.position < oldPosition) {
            player.money += 200;
            console.log(`${player.name} passed GO and collected 200! Total: ${player.money}`);
        }
    }

    handleTile(player) {
        const tile = this.board[player.position];

        switch (tile.type) {
            case 'Property':
                this.handleProperty(player, tile);
                break;
            case 'Tax':
                this.handleTax(player, tile);
                break;
            case 'GO':
                console.log(`Landed on GO. Collecting another 200!`);
                player.money += 200;
                break;
            case 'Jail':
                console.log(`Just visiting Jail.`);
                break;
            case 'GoToJail':
                console.log(`Busted! Moving to Jail.`);
                player.position = 4; // Index of Jail
                break;
        }
    }

    handleProperty(player, tile) {
        if (tile.owner === null) {
            if (player.money >= tile.price) {
                player.money -= tile.price;
                tile.owner = player;
                player.properties.push(tile.name);
                console.log(`${player.name} bought ${tile.name} for ${tile.price}. Remaining money: ${player.money}`);
            } else {
                console.log(`${player.name} couldn't afford ${tile.name}.`);
            }
        } else if (tile.owner !== player) {
            player.money -= tile.rent;
            tile.owner.money += tile.rent;
            console.log(`${player.name} paid ${tile.rent} rent to ${tile.owner.name}. Remaining money: ${player.money}`);
        } else {
            console.log(`${player.name} already owns ${tile.name}.`);
        }
    }

    handleTax(player, tile) {
        player.money -= tile.price;
        console.log(`${player.name} paid ${tile.price} in ${tile.name}. Remaining money: ${player.money}`);
    }

    simulateTurns(numTurns = 5) {
        console.log(`Starting game with ${this.player.name}...`);
        console.log(`Initial money: ${this.player.money}\n`);

        for (let i = 1; i <= numTurns; i++) {
            console.log(`--- Turn ${i} ---`);
            const steps = this.rollDice();
            this.movePlayer(this.player, steps);
            this.handleTile(this.player);
            console.log(`Status: Money: ${this.player.money}, Position: ${this.player.position}, Properties: [${this.player.properties.join(", ")}]\n`);
        }
    }
}

const game = new MonopolyGame();
// game.simulateTurns(10); // Simulating 10 turns as requested (at least 5)
