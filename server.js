import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(__dirname));

const rooms = new Map(); // roomId -> gameState

const GUEST_NAMES = {
    adjectives: ["Neon", "Shadow", "Eerie", "Silent", "Midnight", "Electric", "Dark", "Ghostly", "Radical", "Strange"],
    nouns: ["Tiger", "Wolf", "Ranger", "Sheriff", "Demogorgon", "Waffle", "Bike", "Player", "Void", "Hunter"]
};

const CHARACTERS = [
    { id: "01", name: "Eleven", folder: "Character_01_Eleven", file: "Character Eleven.png" },
    { id: "02", name: "Mike", folder: "Character_02_Mike", file: "Character Mike.png" },
    { id: "03", name: "Joyce", folder: "Character_03_Joyce", file: "Character Joyce.png" },
    { id: "04", name: "Jim", folder: "Character_04_Jim", file: "Character Jim.png" },
    { id: "05", name: "Dustin", folder: "Character_05_Dustin", file: "Character Dustin.png" },
    { id: "06", name: "Lucas", folder: "Character_06_Lucas", file: "Character Lucas.png" },
    { id: "07", name: "Will", folder: "Character_07_Will", file: "Character Will.png" },
    { id: "08", name: "Nancy", folder: "Character_08_Nancy", file: "Character Nancy.png" },
    { id: "09", name: "Steve", folder: "Character_09_Steve", file: "Character Steve.png" },
    { id: "10", name: "Max", folder: "Character_10_Max", file: "Character Max.png" }
];

function generateGuestName(existingPlayers = []) {
    const generate = () => {
        const isCreative = Math.random() > 0.5;
        if (isCreative) {
            const adj = GUEST_NAMES.adjectives[Math.floor(Math.random() * GUEST_NAMES.adjectives.length)];
            const noun = GUEST_NAMES.nouns[Math.floor(Math.random() * GUEST_NAMES.nouns.length)];
            const num = Math.floor(Math.random() * 99) + 1;
            return `${adj}${noun}${num}`;
        } else {
            const prefixes = ["Guest", "Player", "User"];
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
            return `${prefix}_${suffix}`;
        }
    };

    let name = generate();
    let attempts = 0;
    while (existingPlayers.some(p => p.name === name) && attempts < 20) {
        name = generate();
        attempts++;
    }
    return name;
}

const CEREBRO_CARDS = [
    { text: "Radio Check: Dustin finally gets the signal through to Suzie. Collect $100.", action: (s, p) => { p.money += 100; } },
    { text: "Family Video Payday: Steve and Robin had a busy Friday night. Collect $20.", action: (s, p) => { p.money += 20; } },
    { text: "Scoops Ahoy Tips: The 'USS Butterscotch' was a hit today. Collect $10.", action: (s, p) => { p.money += 10; } },
    { text: "Snow Ball King/Queen: You won the vote at the Hawkins Middle dance. Collect $50 from every player.", action: (s, p) => {
        s.players.forEach(other => { if (other.id !== p.id && !other.eliminated) { other.money -= 50; p.money += 50; } });
    }},
    { text: "Grandmother’s Inheritance: Mrs. Wheeler leaves you a small fortune. Collect $100.", action: (s, p) => { p.money += 100; } },
    { text: "D&D Campaign Win: The Party successfully defeated the Lich. Collect $25.", action: (s, p) => { p.money += 25; } },
    { text: "Corroded Coffin Gig: Eddie’s band played a local show. Collect $50.", action: (s, p) => { p.money += 50; } },
    { text: "Hospital Fees: You took a hit from a Demogorgon. Pay $100.", action: (s, p) => { p.money -= 100; } },
    { text: "Bake Sale for Barb: The community gathers to support a cause. Collect $200.", action: (s, p) => { p.money += 200; } },
    { text: "Holiday Fund: Christmas lights aren't just for talking to Will! Collect $100.", action: (s, p) => { p.money += 100; } },
    { text: "School Pictures: You look surprisingly good in your 80s gear. Collect $10.", action: (s, p) => { p.money += 10; } },
    { text: "Wrong Dimension: You accidentally stepped through a gate. Pay $50.", action: (s, p) => { p.money -= 50; } },
    { text: "Life Insurance: Hopper made sure you were taken care of. Collect $100.", action: (s, p) => { p.money += 100; } },
    { text: "Fixing the Cabin: Maintenance on the hideout is expensive. Pay $50.", action: (s, p) => { p.money -= 50; } },
    { text: "Starlight Drive-In: You hosted a movie night for the town. Collect $100.", action: (s, p) => { p.money += 100; } },
    { text: "Consulting Fees: Murray charged you for his private eye work. Pay $50.", action: (s, p) => { p.money -= 50; } }
];

const HELLFIRE_CLUB_CARDS = [
    { text: "Caught in the Vines: The Mind Flayer has detected your presence. Go directly to Jail. Do not pass GO.", action: (s, p) => { p.inJail = true; p.position = 10; p.status = "jail"; } },
    { text: "Gateway Opened: A new rift has appeared in Hawkins. Advance to the nearest 'Cerebro' space.", action: (s, p) => {
        const cerebroIndices = [2, 17, 33];
        const next = cerebroIndices.find(idx => idx > p.position) || cerebroIndices[0];
        if (next < p.position) { p.money += 200; p.status = "reward"; }
        p.position = next;
    }},
    { text: "Vecna's Curse: You hear the grandfather clock chiming. Pay $50 for every house and $200 for every hotel.", action: (s, p) => {
        let total = 0;
        s.board.forEach(t => {
            if (t.owner === p.id) {
                if (t.houses === 5) total += 200;
                else total += t.houses * 50;
            }
        });
        p.money -= total;
    }},
    { text: "Max’s Favorite Song: 'Running Up That Hill' saves you from the red smoke. Get Out of Jail Free card.", action: (s, p) => {
        p.getOutOfJailFreeCards = (p.getOutOfJailFreeCards || 0) + 1;
    }},
    { text: "Demobat Attack: A swarm of bats descends upon you. Pay $15 fine.", action: (s, p) => { p.money -= 15; } },
    { text: "Hitch a Ride with Argyle: The Surfer Boy Pizza van is headed to the lab. Advance to Hawkins National Laboratory. If you pass GO, collect $200.", action: (s, p) => {
        const target = 37; // Hawkins National Laboratory
        if (target < p.position) { p.money += 200; p.status = "reward"; }
        p.position = target;
    }},
    { text: "Echoes in the Void: You find a way to communicate through the lights. Advance to Wheeler House.", action: (s, p) => {
        const target = 21; // Wheeler House
        if (target < p.position) { p.money += 200; p.status = "reward"; }
        p.position = target;
    }},
    { text: "The Party is Separated: Everyone needs to find their way back. Move back three spaces.", action: (s, p) => {
        p.position = (p.position - 3 + 40) % 40;
    }},
    { text: "Enter the Hive Mind: You've tapped into the network. Advance to the nearest tax space.", action: (s, p) => {
        const taxIndices = [4, 38];
        const next = taxIndices.find(idx => idx > p.position) || taxIndices[0];
        if (next < p.position) { p.money += 200; p.status = "reward"; }
        p.position = next;
    }},
    { text: "Property Tax: The town of Hawkins is under repair. Pay $150 to the bank.", action: (s, p) => { p.money -= 150; } },
    { text: "Fireball!: You rolled a natural 20 in Hellfire Club. Collect $50 from every player.", action: (s, p) => {
        s.players.forEach(other => { if (other.id !== p.id && !other.eliminated) { other.money -= 50; p.money += 50; } });
    }},
    { text: "Nina Project: You are recovering your lost memories. Advance to GO (Collect $200).", action: (s, p) => { p.position = 0; p.money += 200; p.status = "reward"; } },
    { text: "Russian Infiltration: You’ve been caught in the underground bunker. Go to Jail. Do not pass GO.", action: (s, p) => { p.inJail = true; p.position = 10; p.status = "jail"; } },
    { text: "Stolen Eggos: Eleven got hungry. Pay $50 for groceries.", action: (s, p) => { p.money -= 50; } },
    { text: "Escape from Starcourt: You barely made it out of the mall. Advance to Starcourt Station.", action: (s, p) => {
        const target = 35; // Starcourt Station
        if (target < p.position) { p.money += 200; p.status = "reward"; }
        p.position = target;
    }},
    { text: "Master of Puppets: Eddie’s solo distracts the monsters. Advance to Bradley’s Big Buy.", action: (s, p) => {
        const target = 16; // Bradley's Big Buy
        if (target < p.position) { p.money += 200; p.status = "reward"; }
        p.position = target;
    }}
];

function addLog(state, message) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.logs.unshift(`[${time}] ${message}`);
    if (state.logs.length > 50) state.logs.pop(); // Keep log manageable
}

function createInitialState(roomId, startCash = 1500) {
    const board = [
        { name: "GO", type: "GO", reward: 200 },
        { name: "Benny's Burgers", type: "property", group: "brown", price: 60, rent: [2, 10, 30, 90, 160, 250], housePrice: 50 },
        { name: "Cerebro", type: "chest" },
        { name: "The Quarry", type: "property", group: "brown", price: 60, rent: [4, 20, 60, 180, 320, 450], housePrice: 50 },
        { name: "Income Tax", type: "tax", price: 200 },
        { name: "Hawkins Station", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
        { name: "Melvald's General Store", type: "property", group: "lightblue", price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
        { name: "Hellfire Club", type: "chance" },
        { name: "Hawkins Middle School", type: "property", group: "lightblue", price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
        { name: "Hawkins High School", type: "property", group: "lightblue", price: 120, rent: [8, 40, 100, 300, 450, 600], housePrice: 50 },
        { name: "Just Visiting / Jail", type: "jail" },
        { name: "The Palace Arcade", type: "property", group: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
        { name: "Hawkins Power & Light", type: "utility", price: 150 },
        { name: "The Cinema", type: "property", group: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
        { name: "Starcourt Mall", type: "property", group: "pink", price: 160, rent: [12, 60, 180, 500, 700, 900], housePrice: 100 },
        { name: "Hellfire Club Station", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
        { name: "Bradley's Big Buy", type: "property", group: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100 },
        { name: "Cerebro", type: "chest" },
        { name: "Hawkins Post", type: "property", group: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100 },
        { name: "Hawkins Community Pool", type: "property", group: "orange", price: 200, rent: [16, 80, 220, 600, 800, 1000], housePrice: 100 },
        { name: "Free Parking", type: "parking" },
        { name: "The Wheeler House", type: "property", group: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
        { name: "Hellfire Club", type: "chance" },
        { name: "The Sinclair House", type: "property", group: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
        { name: "The Byers House", type: "property", group: "red", price: 240, rent: [20, 100, 300, 750, 925, 1100], housePrice: 150 },
        { name: "Hawkins Junction", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
        { name: "Hawkins Public Library", type: "property", group: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150 },
        { name: "Hawkins Police Station", type: "property", group: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150 },
        { name: "Hawkins Water Works", type: "utility", price: 150 },
        { name: "Hawkins General Hospital", type: "property", group: "yellow", price: 280, rent: [24, 120, 360, 850, 1025, 1200], housePrice: 150 },
        { name: "GO TO THE VOID", type: "gotojail" },
        { name: "The Woods", type: "property", group: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200 },
        { name: "Castle Byers", type: "property", group: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200 },
        { name: "Cerebro", type: "chest" },
        { name: "The Pumpkin Patch", type: "property", group: "green", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], housePrice: 200 },
        { name: "Starcourt Station", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
        { name: "Hellfire Club", type: "chance" },
        { name: "Hawkins National Laboratory", type: "property", group: "darkblue", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], housePrice: 200 },
        { name: "The Void Tax", type: "tax", price: 100 },
        { name: "Hellfire Club", type: "property", group: "darkblue", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], housePrice: 200 }
    ].map(t => ({ ...t, owner: null, houses: 0, mortgaged: false }));

    return {
        roomId,
        players: [],
        board,
        turnIndex: 0,
        gameStarted: false,
        winner: null,
        lastRoll: [0, 0],
        doubleCount: 0,
        logs: [],
        startCash,
        phase: 'roll', // roll | action | trade | end | auction
        auction: null, // { tileIndex, highestBid, highestBidderId, participants }
        activeTrade: null // lock for trading
    };
}

function validateTrade(state, player, offer) {
    // 1. check money
    if (player.money < offer.giveCash) return false;

    // 2. check property ownership and houses
    for (let index of offer.giveProps) {
        const tile = state.board[index];
        if (!tile || tile.owner !== player.id) return false;
        if (tile.houses > 0) return false; // no houses allowed
    }

    return true;
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('requestRooms', () => {
        const roomList = Array.from(rooms.values()).map(r => ({
            id: r.roomId,
            players: r.players.length,
            gameStarted: r.gameStarted
        }));
        socket.emit('roomsList', roomList);
    });

    socket.on('createRoom', ({ playerName, startCash }) => {
        console.log(`Server received action: createRoom from ${socket.id}`);
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const state = createInitialState(roomId, parseInt(startCash) || 1500);
        
        const finalName = playerName && playerName.trim() !== "" ? playerName : generateGuestName();
        socket.playerName = finalName;

        const character = CHARACTERS[state.players.length % CHARACTERS.length];
        const player = {
            id: socket.id,
            name: finalName,
            money: state.startCash,
            position: 0,
            properties: [],
            inJail: false,
            jailTurns: 0,
            eliminated: false,
            ready: true, // Host is ready by default
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            character: character,
            status: "waiting" // reward, jail, waiting, buying
        };
        state.players.push(player);
        rooms.set(roomId, state);
        socket.join(roomId);
        addLog(state, `${finalName} created the room!`);
        io.to(roomId).emit('roomCreated', { roomId, state });
        console.log(`Broadcasting gameState to room ${roomId}`);
    });

    socket.on('joinRoom', ({ roomId, playerName }) => {
        console.log(`Server received action: joinRoom ${roomId} from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state || state.gameStarted || state.players.length >= 6) {
            return socket.emit('errorMsg', 'Cannot join room');
        }

        const finalName = playerName && playerName.trim() !== "" ? playerName : generateGuestName(state.players);
        socket.playerName = finalName;

        const character = CHARACTERS[state.players.length % CHARACTERS.length];
        const player = {
            id: socket.id,
            name: finalName,
            money: state.startCash,
            position: 0,
            properties: [],
            inJail: false,
            jailTurns: 0,
            eliminated: false,
            ready: false,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            character: character,
            status: "waiting"
        };
        state.players.push(player);
        socket.join(roomId);
        addLog(state, `${player.name} joined the room!`);
        io.to(roomId).emit('stateUpdate', state);
        console.log(`Broadcasting gameState to room ${roomId}`);
    });

    socket.on('chatMessage', ({ roomId, message }) => {
        console.log(`Server received action: chatMessage from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state) return;
        const player = state.players.find(p => p.id === socket.id);
        if (!player) return;
        io.to(roomId).emit('chatUpdate', { name: player.name, color: player.color, message });
    });

    socket.on('selectCharacter', ({ roomId, charId }) => {
        const state = rooms.get(roomId);
        if (!state || state.gameStarted) return;

        const character = CHARACTERS.find(c => c.id === charId);
        if (!character) return;

        // Check if character is already taken by someone else
        const isTaken = state.players.some(p => p.id !== socket.id && p.character.id === charId);
        if (isTaken) return socket.emit('errorMsg', "Character already taken!");

        const player = state.players.find(p => p.id === socket.id);
        if (player) {
            player.character = character;
            io.to(roomId).emit('stateUpdate', state);
        }
    });

    socket.on('toggleReady', (roomId) => {
        const state = rooms.get(roomId);
        if (!state || state.gameStarted) return;
        const player = state.players.find(p => p.id === socket.id);
        if (player) {
            player.ready = !player.ready;
            const status = player.ready ? "is READY! ✅" : "is no longer ready. ⏳";
            addLog(state, `${player.name} ${status}`);
            io.to(roomId).emit('stateUpdate', state);
        }
    });

    socket.on('startGame', (roomId) => {
        console.log(`Server received action: startGame for room ${roomId} from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state) return console.log(`Room ${roomId} not found`);
        
        const isHost = state.players[0].id === socket.id;
        const allReady = state.players.every(p => p.ready);

        if (isHost) {
            // Simplified: Always allow starting if the host wants to, even alone for testing
            state.gameStarted = true;
            state.phase = 'roll'; // Explicitly set starting phase
            state.turnIndex = 0;
            addLog(state, `Game started by ${state.players[0].name}!`);
            io.to(roomId).emit('stateUpdate', state);
            console.log(`Game started in room ${roomId}`);
        } else {
            console.log(`Player ${socket.id} is not the host`);
            socket.emit('errorMsg', 'Only the host can start the game!');
        }
    });

    socket.on('rollDice', (roomId) => {
        console.log(`Server received action: rollDice from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state || !state.gameStarted || state.winner || state.phase !== 'roll') return;
        
        const player = state.players[state.turnIndex];
        if (player.id !== socket.id) return;

        if (player.inJail) {
            player.jailTurns++;
            player.status = "jail";
            handleRoll(roomId, socket.id);
        } else {
            player.status = "waiting";
            handleRoll(roomId, socket.id);
        }
    });

    socket.on('buyProperty', (roomId) => {
        console.log(`Server received action: buyProperty from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state || state.phase !== 'action') return;
        const player = state.players[state.turnIndex];
        if (player.id !== socket.id) return;

        const tile = state.board[player.position];
        if (!tile.owner && (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility')) {
            if (player.money >= tile.price) {
                player.money -= tile.price;
                tile.owner = player.id;
                player.properties.push(tile.name);
                player.status = "buying";
                addLog(state, `${player.name} bought ${tile.name} for $${tile.price}`);
                
                state.phase = 'end';
                
                io.to(roomId).emit('stateUpdate', state);
            }
        }
    });

    socket.on('passProperty', (roomId) => {
        console.log(`Server received action: passProperty from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state || state.phase !== 'action') return;
        const player = state.players[state.turnIndex];
        if (player.id !== socket.id) return;

        addLog(state, `${player.name} chose not to buy. Starting auction!`);
        
        // Start Auction
        state.phase = 'auction';
        state.auction = {
            tileIndex: player.position,
            highestBid: 10,
            highestBidderId: null,
            participants: state.players.filter(p => !p.eliminated).map(p => p.id)
        };
        
        io.to(roomId).emit('stateUpdate', state);
    });

    socket.on('placeBid', ({ roomId, bidAmount }) => {
        const state = rooms.get(roomId);
        if (!state || state.phase !== 'auction' || !state.auction) return;
        
        const player = state.players.find(p => p.id === socket.id);
        if (!player || player.eliminated || !state.auction.participants.includes(socket.id)) return;
        
        if (bidAmount > state.auction.highestBid && player.money >= bidAmount) {
            state.auction.highestBid = bidAmount;
            state.auction.highestBidderId = socket.id;
            addLog(state, `${player.name} bid $${bidAmount}`);
            io.to(roomId).emit('stateUpdate', state);
        }
    });

    socket.on('foldAuction', (roomId) => {
        const state = rooms.get(roomId);
        if (!state || state.phase !== 'auction' || !state.auction) return;
        
        state.auction.participants = state.auction.participants.filter(id => id !== socket.id);
        const player = state.players.find(p => p.id === socket.id);
        addLog(state, `${player.name} folded.`);
        
        if (state.auction.participants.length <= 1) {
            finishAuction(state, roomId);
        } else {
            io.to(roomId).emit('stateUpdate', state);
        }
    });

    socket.on('mortgageProperty', ({ roomId, tileIndex }) => {
        const state = rooms.get(roomId);
        if (!state) return;
        const player = state.players.find(p => p.id === socket.id);
        const tile = state.board[tileIndex];
        
        if (tile && tile.owner === socket.id && !tile.mortgaged && tile.houses === 0) {
            tile.mortgaged = true;
            const mortgageValue = Math.floor(tile.price / 2);
            player.money += mortgageValue;
            addLog(state, `${player.name} mortgaged ${tile.name} for $${mortgageValue}`);
            io.to(roomId).emit('stateUpdate', state);
        }
    });

    socket.on('unmortgageProperty', ({ roomId, tileIndex }) => {
        const state = rooms.get(roomId);
        if (!state) return;
        const player = state.players.find(p => p.id === socket.id);
        const tile = state.board[tileIndex];
        
        const unmortgageCost = Math.floor((tile.price / 2) * 1.1);
        if (tile && tile.owner === socket.id && tile.mortgaged && player.money >= unmortgageCost) {
            player.money -= unmortgageCost;
            tile.mortgaged = false;
            addLog(state, `${player.name} unmortgaged ${tile.name} for $${unmortgageCost}`);
            io.to(roomId).emit('stateUpdate', state);
        }
    });

    socket.on('endTurn', (roomId) => {
        console.log(`Server received action: endTurn from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state || state.phase !== 'end') return;
        const player = state.players[state.turnIndex];
        if (player.id !== socket.id) return;

        // Check if player gets another roll (doubles)
        if (state.doubleCount > 0 && !player.inJail && !player.eliminated) {
            state.phase = 'roll';
            addLog(state, `${player.name} gets another roll for doubles!`);
        } else {
            nextTurn(state, roomId);
        }
        
        io.to(roomId).emit('stateUpdate', state);
    });

    socket.on('payJail', (roomId) => {
        console.log(`Server received action: payJail from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state) return;
        const player = state.players.find(p => p.id === socket.id);
        if (!player || !player.inJail) return;

        if (player.getOutOfJailFreeCards > 0) {
            player.getOutOfJailFreeCards--;
            player.inJail = false;
            player.jailTurns = 0;
            player.status = "waiting";
            addLog(state, `${player.name} used a Get Out of Jail Free card!`);
            io.to(roomId).emit('stateUpdate', state);
        } else if (player.money >= 50) {
            player.money -= 50;
            player.inJail = false;
            player.jailTurns = 0;
            player.status = "waiting";
            addLog(state, `${player.name} paid $50 to leave Jail!`);
            io.to(roomId).emit('stateUpdate', state);
        }
    });

    socket.on('requestTradePhase', (roomId) => {
        const state = rooms.get(roomId);
        if (!state || state.phase === 'trade' || state.activeTrade) return;
        
        // Anyone can request a trade phase
        state.previousPhase = state.phase;
        state.phase = 'trade';
        state.tradeRequesterId = socket.id;
        io.to(roomId).emit('stateUpdate', state);
    });

    socket.on('cancelTradePhase', (roomId) => {
        const state = rooms.get(roomId);
        if (!state || state.phase !== 'trade' || state.activeTrade) return;
        
        state.phase = state.previousPhase || 'roll';
        state.tradeRequesterId = null;
        io.to(roomId).emit('stateUpdate', state);
    });

    socket.on('offerTrade', ({ roomId, toPlayerId, offer }) => {
        console.log(`Server received action: offerTrade from ${socket.id} to ${toPlayerId}`);
        const state = rooms.get(roomId);
        if (!state) return;
        
        // 🚨 7. CRITICAL FIX (YOU ARE MISSING THIS)
        if (state.phase !== 'trade') {
            return socket.emit('errorMsg', "You must be in the Trade phase to offer a trade.");
        }

        // 🔒 1. ADD TRADE LOCK (VERY IMPORTANT)
        if (state.activeTrade) {
            return socket.emit('errorMsg', "A trade is already in progress. Wait for it to finish.");
        }

        const fromPlayer = state.players.find(p => p.id === socket.id);
        const toPlayer = state.players.find(p => p.id === toPlayerId);
        if (!fromPlayer || !toPlayer) return;

        // 🧠 2. STRICT SERVER VALIDATION (IMPROVED)
        if (!validateTrade(state, fromPlayer, offer)) {
            return socket.emit('errorMsg', "Invalid trade offer. Check your funds and properties.");
        }

        state.activeTrade = {
            from: { id: fromPlayer.id, name: fromPlayer.name },
            to: { id: toPlayer.id, name: toPlayer.name },
            offer,
            status: "pending"
        };

        addLog(state, `${fromPlayer.name} offered a trade to ${toPlayer.name}`);
        io.to(roomId).emit('stateUpdate', state); // Broadcast the log update

        io.to(toPlayerId).emit('tradeProposed', state.activeTrade);
    });

    socket.on('acceptTrade', ({ roomId }) => {
        console.log(`Server received action: acceptTrade from ${socket.id}`);
        const state = rooms.get(roomId);
        if (!state || !state.activeTrade) return;

        const trade = state.activeTrade;
        const p1 = state.players.find(p => p.id === trade.from.id);
        const p2 = state.players.find(p => p.id === trade.to.id);
        
        if (!p1 || !p2 || socket.id !== p2.id) return;

        const offer = trade.offer;

        // 🔍 FINAL CHECK AGAIN
        if (p1.money < offer.giveCash || p2.money < offer.getCash) {
            state.activeTrade = null;
            state.phase = state.previousPhase || 'roll';
            state.tradeRequesterId = null;
            io.to(roomId).emit('stateUpdate', state);
            return socket.emit('errorMsg', "Insufficient funds for trade.");
        }
        
        // 🏠 PROPERTY CHECK AGAIN
        const p1OwnsAll = offer.giveProps.every(idx => state.board[idx].owner === p1.id && state.board[idx].houses === 0);
        const p2OwnsAll = offer.getProps.every(idx => state.board[idx].owner === p2.id && state.board[idx].houses === 0);
        
        if (!p1OwnsAll || !p2OwnsAll) {
            state.activeTrade = null;
            state.phase = state.previousPhase || 'roll';
            state.tradeRequesterId = null;
            io.to(roomId).emit('stateUpdate', state);
            return socket.emit('errorMsg', "Properties in trade are no longer valid (owned by others or have houses).");
        }

        // 💰 CASH TRANSFER
        p1.money = p1.money - offer.giveCash + offer.getCash;
        p2.money = p2.money - offer.getCash + offer.giveCash;

        // 🏠 PROPERTY TRANSFER
        offer.giveProps.forEach(idx => {
            const tile = state.board[idx];
            tile.owner = p2.id;
            tile.houses = 0; 
            p1.properties = p1.properties.filter(n => n !== tile.name);
            p2.properties.push(tile.name);
        });
        offer.getProps.forEach(idx => {
            const tile = state.board[idx];
            tile.owner = p1.id;
            tile.houses = 0;
            p2.properties = p2.properties.filter(n => n !== tile.name);
            p1.properties.push(tile.name);
        });

        addLog(state, `Trade completed between ${p1.name} and ${p2.name}`);
        
        // 🔄 RESET TRADE & PHASE
        state.activeTrade = null;
        state.phase = state.previousPhase || 'roll';
        state.tradeRequesterId = null;
        
        io.to(roomId).emit('stateUpdate', state);
    });

    socket.on('rejectTrade', ({ roomId }) => {
        const state = rooms.get(roomId);
        if (!state || !state.activeTrade) return;
        
        const trade = state.activeTrade;
        if (socket.id === trade.to.id || socket.id === trade.from.id) {
            addLog(state, "Trade offer rejected.");
            state.activeTrade = null;
            state.phase = state.previousPhase || 'roll';
            state.tradeRequesterId = null;
            io.to(roomId).emit('stateUpdate', state);
        }
    });

    socket.on('buyHouse', ({ roomId, tileIndex }) => {
        console.log(`Server received action: buyHouse from ${socket.id} on tile ${tileIndex}`);
        const state = rooms.get(roomId);
        if (!state || !state.gameStarted) return;
        const player = state.players.find(p => p.id === socket.id);
        const tile = state.board[tileIndex];
        
        if (tile && tile.type === 'property' && tile.owner === socket.id && player.money >= tile.housePrice && tile.houses < 5 && !tile.mortgaged) {
        const groupTiles = state.board.filter(t => t.group === tile.group);
        const ownsAll = groupTiles.every(t => t.owner === socket.id && !t.mortgaged);
        
        if (ownsAll) {
            // Even building rule: Cannot build more than 1 house difference in group
            const minHouses = Math.min(...groupTiles.map(t => t.houses));
            if (tile.houses <= minHouses) {
                player.money -= tile.housePrice;
                tile.houses++;
                addLog(state, `${player.name} upgraded ${tile.name} (Now ${tile.houses === 5 ? 'Hotel' : tile.houses + ' Houses'})`);
                io.to(roomId).emit('stateUpdate', state);
            } else {
                socket.emit('errorMsg', "Build houses evenly across the group!");
            }
        } else {
            socket.emit('errorMsg', "You must own all properties in the group and none can be mortgaged!");
        }
    }
});

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        for (const [roomId, state] of rooms.entries()) {
            const index = state.players.findIndex(p => p.id === socket.id);
            if (index !== -1) {
                const playerName = state.players[index].name;
                state.players.splice(index, 1);
                addLog(state, `${playerName} left the room.`);
                if (state.players.length === 0) {
                    rooms.delete(roomId);
                } else {
                    state.turnIndex = state.turnIndex % state.players.length;
                    io.to(roomId).emit('stateUpdate', state);
                    console.log(`Broadcasting gameState to room ${roomId}`);
                }
                break;
            }
        }
    });
});

function handleRoll(roomId, playerId) { 
    const state = rooms.get(roomId); 
    if (!state) return; 
    const player = state.players[state.turnIndex]; 
    if (player.id !== playerId || player.eliminated) return; 
 
    const d1 = Math.floor(Math.random() * 6) + 1; 
    const d2 = Math.floor(Math.random() * 6) + 1; 
    const total = d1 + d2; 
    const isDoubles = d1 === d2; 
    state.lastRoll = [d1, d2]; 
 
    // Log the roll first 
    addLog(state, `${player.name} rolled ${total} (${d1}+${d2})`); 
 
    if (isDoubles) { 
        state.doubleCount++; 
        if (state.doubleCount >= 3) { 
            player.inJail = true; 
            player.position = 10; 
            player.status = 'jail'; 
            state.doubleCount = 0; 
            addLog(state, `${player.name} rolled 3 doubles in a row and is sent to Jail!`); 
            state.phase = 'end'; 
        } else if (player.inJail) { 
            player.inJail = false; 
            player.jailTurns = 0; 
            addLog(state, `${player.name} rolled doubles and escaped Jail!`); 
            movePlayer(state, player, total, roomId); 
            // After moving, log that they get another turn 
            if (state.phase === 'end') { 
                addLog(state, `${player.name} gets another roll for doubles!`); 
            } 
        } else { 
            movePlayer(state, player, total, roomId); 
            // Log doubles AFTER landing so the log reads in the right order 
            if (state.phase !== 'end') { 
                // tile requires action first — doubles turn will resume after 
            } 
            addLog(state, `${player.name} rolled doubles and gets another turn!`); 
        } 
    } else { 
        state.doubleCount = 0; 
        if (player.inJail) { 
            player.jailTurns = (player.jailTurns || 0) + 1; 
            if (player.jailTurns >= 3) { 
                player.money -= 50; 
                player.inJail = false; 
                player.jailTurns = 0; 
                addLog(state, `${player.name} paid $50 bail after 3 turns and is released.`); 
                movePlayer(state, player, total, roomId); 
            } else { 
                addLog(state, `${player.name} remains in Jail. (Turn ${player.jailTurns}/3)`); 
                state.phase = 'end'; 
            } 
        } else { 
            movePlayer(state, player, total, roomId); 
        } 
    } 
 
    checkBankruptcy(state, player); 
    checkWinner(state, roomId); 
    io.to(roomId).emit('stateUpdate', state); 
}

function nextTurn(state, roomId) {
    const prevPlayer = state.players[state.turnIndex];
    if (prevPlayer) {
        // Reset status to waiting when turn ends
        if (prevPlayer.status !== "jail") prevPlayer.status = "waiting";
    }

    do {
        state.turnIndex = (state.turnIndex + 1) % state.players.length;
    } while (state.players[state.turnIndex].eliminated);
    
    const currentPlayer = state.players[state.turnIndex];
    addLog(state, `It's now ${currentPlayer.name}'s turn.`);
    
    state.phase = 'roll';
    state.doubleCount = 0;
}

function movePlayer(state, player, steps, roomId) {
    const oldPos = player.position;
    player.position = (player.position + steps) % 40;
    if (player.position < oldPos) {
        player.money += 200;
        player.status = "reward";
        addLog(state, `${player.name} passed GO and collected $200`);
    } else {
        // Reset status if not passing GO and not specifically set elsewhere
        if (player.status === "reward") player.status = "waiting";
    }
    handleTile(state, player, roomId);
}

function handleTile(state, player, roomId) { 
    const tile = state.board[player.position]; 
    addLog(state, `${player.name} landed on ${tile.name}`); 
 
    if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') { 
        if (!tile.owner) { 
            state.phase = 'action'; // Wait for buy / pass / auction 
        } else if (tile.owner !== player.id) { 
            const owner = state.players.find(p => p.id === tile.owner); 
            if (owner && !owner.eliminated) { 
                if (tile.mortgaged) { 
                    addLog(state, `${tile.name} is mortgaged — no rent collected.`); 
                } else { 
                    let rent = 0; 
                    if (tile.type === 'property') { 
                        rent = tile.rent[tile.houses]; 
                        // Double rent if owner has monopoly and no houses 
                        if (tile.houses === 0) { 
                            const groupTiles = state.board.filter(t => t.group === tile.group); 
                            if (groupTiles.every(t => t.owner === tile.owner && !t.mortgaged)) { 
                                rent *= 2; 
                            } 
                        } 
                    } else if (tile.type === 'railroad') { 
                        const ownedCount = state.board.filter( 
                            t => t.type === 'railroad' && t.owner === tile.owner 
                         ).length; 
                        rent = tile.rent[ownedCount - 1]; 
                    } else if (tile.type === 'utility') { 
                        const ownedCount = state.board.filter( 
                            t => t.type === 'utility' && t.owner === tile.owner 
                         ).length; 
                        const rollTotal = state.lastRoll[0] + state.lastRoll[1]; 
                        rent = (ownedCount === 1 ? 4 : 10) * (rollTotal || 7); 
                    } 
 
                    player.money -= rent; 
                    owner.money += rent; 
                    addLog(state, `${player.name} paid $${rent} rent to ${owner.name} for ${tile.name}.`); 
                } 
            } 
            state.phase = 'end'; 
        } else { 
            // Own property — nothing to do 
            state.phase = 'end'; 
        } 
 
    } else { 
        switch (tile.type) { 
            case 'tax': { 
                player.money -= tile.price; 
                addLog(state, `${player.name} paid $${tile.price} in taxes (${tile.name}).`); 
                state.phase = 'end'; 
                break; 
            } 
 
            // ── FIX: was checking tile.name === 'Hellfire Club' which never matched ── 
            case 'gotojail': { 
                player.inJail = true; 
                player.position = 10;  // move FIRST … 
                player.status = 'jail'; 
                addLog(state, `${player.name} is sent to Jail!`);  // … log AFTER 
                state.phase = 'end'; 
                break; 
            } 
 
            // ── FIX: Hellfire Club tiles (type==='chance') now correctly draw Hellfire Club cards ── 
            case 'chance': { 
                const card = HELLFIRE_CLUB_CARDS[Math.floor(Math.random() * HELLFIRE_CLUB_CARDS.length)]; 
                addLog(state, `${player.name} drew from Hellfire Club: ${card.text}`); 
 
                const playerSocket = io.sockets.sockets.get(player.id); 
                if (playerSocket) { 
                    playerSocket.emit('cardDrawn', { type: 'chance', text: card.text }); 
                } 
 
                card.action(state, player); 
                state.phase = 'end'; 
                break; 
            } 
 
            case 'chest': { 
                const card = CEREBRO_CARDS[Math.floor(Math.random() * CEREBRO_CARDS.length)]; 
                addLog(state, `${player.name} drew from Cerebro: ${card.text}`); 
 
                const playerSocket = io.sockets.sockets.get(player.id); 
                if (playerSocket) { 
                    playerSocket.emit('cardDrawn', { type: 'chest', text: card.text }); 
                } 
 
                card.action(state, player); 
                state.phase = 'end'; 
                break; 
            } 
 
            default: { 
                // Free Parking, visiting Jail, GO 
                player.status = 'waiting'; 
                state.phase = 'end'; 
                break; 
            } 
        } 
    } 
}

function checkBankruptcy(state, player) {
    if (player.money < 0 && !player.eliminated) {
        // Calculate potential assets
        const assets = calculateNetWorth(state, player) - player.money;
        if (player.money + assets < 0) {
            player.eliminated = true;
            addLog(state, `${player.name} has gone bankrupt and is eliminated!`);
            state.board.forEach(tile => {
                if (tile.owner === player.id) {
                    tile.owner = null;
                    tile.houses = 0;
                    tile.mortgaged = false;
                }
            });
        } else {
            const socketOfPlayer = io.sockets.sockets.get(player.id);
            if (socketOfPlayer) socketOfPlayer.emit('errorMsg', "You are in debt! Mortgage properties or sell houses to pay.");
        }
    }
}

function checkWinner(state, roomId) {
    const activePlayers = state.players.filter(p => !p.eliminated);
    if (activePlayers.length === 1 && state.gameStarted) {
        state.winner = activePlayers[0].name;
        addLog(state, `GAME OVER! ${state.winner} WINS!`);
    }
}

function calculateNetWorth(state, player) {
    let worth = player.money;
    state.board.forEach(tile => {
        if (tile.owner === player.id) {
            worth += tile.mortgaged ? (tile.price / 2) : tile.price;
            worth += tile.houses * tile.housePrice;
        }
    });
    return worth;
}

function finishAuction(state, roomId) {
    if (!state.auction) return;
    
    if (state.auction.highestBidderId) {
        const winner = state.players.find(p => p.id === state.auction.highestBidderId);
        const tile = state.board[state.auction.tileIndex];
        
        if (winner && winner.money >= state.auction.highestBid) {
            winner.money -= state.auction.highestBid;
            tile.owner = winner.id;
            winner.properties.push(tile.name);
            addLog(state, `${winner.name} won ${tile.name} in auction for $${state.auction.highestBid}`);
        }
    } else {
        addLog(state, `No one bid on ${state.board[state.auction.tileIndex].name}. Property remains unowned.`);
    }

    state.auction = null;
    state.phase = 'end';
    io.to(roomId).emit('stateUpdate', state);
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
                break;
            }
        }
    }
    console.log(`\n🚀 Hawkins Monopoly server is LIVE!`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${localIp}:${PORT}`);
    console.log(`\n👉 IMPORTANT:`);
    console.log(`   1. Stop "Vite" or "Live Server" if they are running.`);
    console.log(`   2. Refresh your browser at the URLs above.`);
    console.log(`   3. If it fails, check your firewall settings.\n`);
});
