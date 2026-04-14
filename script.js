/**
 * Monopoly Multiplayer Client Logic (Serverless with Firebase RTDB)
 */

// Constants and Data (Moved from server.js)
const CHARACTERS = [
    { id: "01", name: "Eleven", folder: "Character_01_Eleven", file: "Character Eleven.png", color: "#e11d48" },
    { id: "02", name: "Mike", folder: "Character_02_Mike", file: "Character Mike.png", color: "#2563eb" },
    { id: "03", name: "Joyce", folder: "Character_03_Joyce", file: "Character Joyce.png", color: "#16a34a" },
    { id: "04", name: "Jim", folder: "Character_04_Jim", file: "Character Jim.png", color: "#ca8a04" },
    { id: "05", name: "Dustin", folder: "Character_05_Dustin", file: "Character Dustin.png", color: "#9333ea" },
    { id: "06", name: "Lucas", folder: "Character_06_Lucas", file: "Character Lucas.png", color: "#ea580c" },
    { id: "07", name: "Will", folder: "Character_07_Will", file: "Character Will.png", color: "#0891b2" },
    { id: "08", name: "Nancy", folder: "Character_08_Nancy", file: "Character Nancy.png", color: "#db2777" },
    { id: "09", name: "Steve", folder: "Character_09_Steve", file: "Character Steve.png", color: "#4f46e5" },
    { id: "10", name: "Max", folder: "Character_10_Max", file: "Character Max.png", color: "#dc2626" }
];

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

// Helper: Game Logic (Moved from server.js)
function addLog(state, message) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (!state.logs) state.logs = [];
    state.logs.unshift(`[${time}] ${message}`);
    if (state.logs.length > 50) state.logs.pop();
}

function createInitialState(roomId, startCash = 1500) {
    const board = [
        { name: "GO", type: "GO", reward: 200 },
        { name: "Benny's Burgers", type: "property", group: "brown", price: 60, rent: [2, 10, 30, 90, 160, 250], housePrice: 50 },
        { name: "Cerebro", type: "chest", img: "/assets/cards/Cerebro.png" },
        { name: "The Quarry", type: "property", group: "brown", price: 60, rent: [4, 20, 60, 180, 320, 450], housePrice: 50 },
        { name: "Income Tax", type: "tax", price: 200 },
        { name: "Hawkins Station", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
        { name: "Melvald's General Store", type: "property", group: "lightblue", price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
        { name: "Hellfire Club", type: "chance", img: "/assets/cards/Hellfire Club.png" },
        { name: "Hawkins Middle School", type: "property", group: "lightblue", price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
        { name: "Hawkins High School", type: "property", group: "lightblue", price: 120, rent: [8, 40, 100, 300, 450, 600], housePrice: 50 },
        { name: "Just Visiting / Jail", type: "jail" },
        { name: "The Palace Arcade", type: "property", group: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
        { name: "Hawkins Power & Light", type: "utility", price: 150 },
        { name: "The Cinema", type: "property", group: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
        { name: "Starcourt Mall", type: "property", group: "pink", price: 160, rent: [12, 60, 180, 500, 700, 900], housePrice: 100 },
        { name: "Hellfire Club Station", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
        { name: "Bradley's Big Buy", type: "property", group: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100 },
        { name: "Cerebro", type: "chest", img: "/assets/cards/Cerebro.png" },
        { name: "Hawkins Post", type: "property", group: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100 },
        { name: "Hawkins Community Pool", type: "property", group: "orange", price: 200, rent: [16, 80, 220, 600, 800, 1000], housePrice: 100 },
        { name: "Free Parking", type: "parking" },
        { name: "The Wheeler House", type: "property", group: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
        { name: "Hellfire Club", type: "chance", img: "/assets/cards/Hellfire Club.png" },
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
        { name: "Cerebro", type: "chest", img: "/assets/cards/Cerebro.png" },
        { name: "The Pumpkin Patch", type: "property", group: "green", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], housePrice: 200 },
        { name: "Starcourt Station", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
        { name: "Hellfire Club", type: "chance", img: "/assets/cards/Hellfire Club.png" },
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
        phase: 'roll',
        auction: null,
        activeTrade: null
    };
}

// Sound synthesizer
const Sound = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(freq, type = 'sine', duration = 0.1, volume = 0.1) {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    dice() { this.play(150, 'square', 0.05, 0.05); },
    money() { this.play(800, 'sine', 0.1, 0.1); setTimeout(() => this.play(1200, 'sine', 0.1, 0.1), 50); },
    buy() { this.play(400, 'triangle', 0.2, 0.1); },
    jail() { this.play(100, 'sawtooth', 0.3, 0.1); }
};

class MonopolyClient {
    constructor() {
        this.roomId = null;
        this.state = null;
        this.playerName = "";
        this.playerId = null; // Firebase UID or random ID
        this.isMoving = false;
        
        // Character definitions
        this.characters = CHARACTERS;

        this.initFirebase();
        this.initLandingPage();
        this.initLobby();
        this.initUIEvents();
    }

    initFirebase() {
        const { db, onValue, ref } = window.fbDB;
        this.db = db;
        
        // Monitor server status (Firebase connection)
        const connectedRef = ref(db, ".info/connected");
        onValue(connectedRef, (snap) => {
            const indicator = document.getElementById('server-status');
            if (indicator) {
                if (snap.val() === true) {
                    indicator.style.background = '#10b981'; // Green
                    indicator.title = "Connected to Firebase";
                } else {
                    indicator.style.background = '#ef4444'; // Red
                    indicator.title = "Disconnected from Firebase";
                }
            }
        });
    }

    generateRandomName() {
        const adjectives = ["Neon", "Shadow", "Eerie", "Silent", "Midnight", "Electric", "Dark", "Ghostly", "Radical", "Strange"];
        const nouns = ["Tiger", "Wolf", "Ranger", "Sheriff", "Demogorgon", "Waffle", "Bike", "Player", "Void", "Hunter"];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 99) + 1;
        return `${adj}${noun}${num}`;
    }

    initLandingPage() {
        const landingPage = document.getElementById('landing-page');
        const playBtn = document.getElementById('landing-play-btn');
        const nameInput = document.getElementById('landing-name-input');
        const randomizeBtn = document.getElementById('randomize-name-btn');
        const navRoomsBtn = document.getElementById('nav-rooms');
        const navCreateBtn = document.getElementById('nav-create');
        const roomsModal = document.getElementById('rooms-modal');
        const closeRoomsBtn = document.getElementById('close-rooms-btn');
        const sporesContainer = document.getElementById('spores-container');

        nameInput.value = this.generateRandomName();
        
        randomizeBtn.onclick = () => {
            nameInput.value = this.generateRandomName();
            Sound.dice();
        };

        navRoomsBtn.onclick = () => {
            roomsModal.classList.remove('hidden');
            this.listRooms();
        };

        navCreateBtn.onclick = () => {
            this.playerName = nameInput.value || "Anonymous";
            document.getElementById('player-name').value = this.playerName;
            landingPage.classList.add('hidden');
            document.getElementById('lobby-screen').classList.remove('hidden');
        };

        if (closeRoomsBtn) closeRoomsBtn.onclick = () => roomsModal.classList.add('hidden');

        playBtn.onclick = () => {
            this.playerName = nameInput.value || "Anonymous";
            document.getElementById('player-name').value = this.playerName;
            Sound.init();
            landingPage.classList.add('hidden');
            document.getElementById('lobby-screen').classList.remove('hidden');
        };

        // Spores and Lights generation...
        this.generateEffects(sporesContainer);
    }

    generateEffects(sporesContainer) {
        for (let i = 0; i < 60; i++) {
            const spore = document.createElement('div');
            spore.className = 'spore';
            const size = Math.random() * 5 + 2;
            spore.style.width = `${size}px`;
            spore.style.height = `${size}px`;
            spore.style.left = `${Math.random() * 100}%`;
            spore.style.top = `${Math.random() * 100}%`;
            spore.style.setProperty('--x', `${(Math.random() - 0.5) * 250}px`);
            spore.style.setProperty('--y', `${(Math.random() - 0.5) * 250}px`);
            spore.style.setProperty('--d', `${Math.random() * 6 + 4}s`);
            sporesContainer.appendChild(spore);
        }

        const lightsWire = document.getElementById('lights-wire');
        if (lightsWire) {
            const colors = ['#ff0000', '#00cc00', '#0066ff', '#ffff00', '#ff6600', '#cc00ff', '#00cccc'];
            const numLights = 30;
            for (let i = 0; i < numLights; i++) {
                const bulb = document.createElement('div');
                bulb.className = 'light-bulb';
                const color = colors[i % colors.length];
                bulb.style.backgroundColor = color;
                bulb.style.boxShadow = `0 3px 10px ${color}, 0 0 20px ${color}40`;
                bulb.style.left = `${(i / (numLights - 1)) * 100}%`;
                bulb.style.setProperty('--delay', `${Math.random() * 3}s`);
                bulb.style.setProperty('--speed', `${1.5 + Math.random() * 2}s`);
                lightsWire.appendChild(bulb);
            }
        }
    }

    listRooms() {
        const { db, ref, onValue } = window.fbDB;
        const roomsRef = ref(db, 'rooms');
        onValue(roomsRef, (snapshot) => {
            const rooms = snapshot.val();
            const container = document.getElementById('rooms-list-container');
            if (!container) return;
            if (!rooms) {
                container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;">No active rooms. Create one!</p>';
                return;
            }
            const roomList = Object.keys(rooms).map(id => ({
                id: id,
                players: rooms[id].players ? Object.keys(rooms[id].players).length : 0,
                gameStarted: rooms[id].gameStarted
            }));
            container.innerHTML = roomList.map(r => `
                <div class="room-item">
                    <div class="room-info">
                        <span class="room-id">${r.id}</span>
                        <span class="room-players">${r.players} player(s)</span>
                        <span class="room-status">${r.gameStarted ? 'In Progress' : 'Waiting'}</span>
                    </div>
                    ${!r.gameStarted ? `<button class="join-room-small-btn" onclick="app.joinSpecificRoom('${r.id}')">JOIN</button>` : '<span style="color:var(--text-dim);font-size:12px;">Game in progress</span>'}
                </div>
            `).join('');
        });
    }

    initLobby() {
        const createBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const backBtn = document.getElementById('lobby-back-btn');
        const nameInput = document.getElementById('player-name');
        const cashInput = document.getElementById('setting-cash');
        const roomIdInput = document.getElementById('room-id-input');

        backBtn.onclick = () => {
            document.getElementById('lobby-screen').classList.add('hidden');
            document.getElementById('landing-page').classList.remove('hidden');
        };

        createBtn.onclick = async () => {
            this.playerName = nameInput.value || "Anonymous";
            const startCash = parseInt(cashInput.value) || 1500;
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            this.playerId = this.getUniqueId();
            
            const state = createInitialState(roomId, startCash);
            const character = CHARACTERS[0];
            const player = {
                id: this.playerId,
                name: this.playerName,
                money: startCash,
                position: 0,
                properties: [],
                inJail: false,
                jailTurns: 0,
                eliminated: false,
                ready: true,
                color: character.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
                character: character,
                status: "waiting"
            };
            state.players = [player];
            addLog(state, `${this.playerName} created the room!`);

            const { db, ref, set } = window.fbDB;
            await set(ref(db, `rooms/${roomId}`), state);
            this.joinRoom(roomId);
        };

        joinBtn.onclick = () => {
            const rid = roomIdInput.value.trim().toUpperCase();
            if (!rid) return this.notify("Enter a Room ID", "error");
            this.playerName = nameInput.value || "Anonymous";
            this.joinRoom(rid);
        };
    }

    getUniqueId() {
        const { auth } = window.fbAuth;
        if (auth.currentUser) return auth.currentUser.uid;
        return 'user_' + Math.random().toString(36).substring(2, 9);
    }

    async joinRoom(roomId) {
        const { db, ref, get, runTransaction } = window.fbDB;
        const roomRef = ref(db, `rooms/${roomId}`);
        
        try {
            const result = await runTransaction(roomRef, (state) => {
                if (!state) return state; // Room doesn't exist
                if (state.gameStarted || state.players.length >= 6) return; // Cannot join
                
                if (!this.playerId) this.playerId = this.getUniqueId();
                if (state.players.some(p => p.id === this.playerId)) return state; // Already in

                const character = CHARACTERS[state.players.length % CHARACTERS.length];
                const player = {
                    id: this.playerId,
                    name: this.playerName,
                    money: state.startCash,
                    position: 0, // Starts on GO (Index 0)
                    properties: [],
                    inJail: false,
                    jailTurns: 0,
                    eliminated: false,
                    ready: false,
                    color: character.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
                    character: character,
                    status: "waiting"
                };
                state.players.push(player);
                addLog(state, `${player.name} joined the room!`);
                return state;
            });

            if (result.committed) {
                this.roomId = roomId;
                this.listenToState(roomId);
                this.listenToChats(roomId);
            } else {
                this.notify("Cannot join room", "error");
            }
        } catch (e) {
            console.error("Join error:", e);
            this.notify("Room not found", "error");
        }
    }

    listenToState(roomId) {
        const { db, ref, onValue } = window.fbDB;
        const roomRef = ref(db, `rooms/${roomId}`);
        onValue(roomRef, (snapshot) => {
            const state = snapshot.val();
            if (state) this.handleStateUpdate(state);
        });
    }

    initUIEvents() {
        const rollBtn = document.getElementById('roll-btn');
        if (rollBtn) rollBtn.onclick = () => this.performAction('rollDice');

        const buyBtn = document.getElementById('buy-btn');
        if (buyBtn) buyBtn.onclick = () => this.performAction('buyProperty');

        const passBtn = document.getElementById('pass-btn');
        if (passBtn) passBtn.onclick = () => this.performAction('passProperty');

        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) endTurnBtn.onclick = () => this.performAction('endTurn');

        const readyBtn = document.getElementById('ready-btn');
        if (readyBtn) readyBtn.onclick = () => this.performAction('toggleReady');

        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) startBtn.onclick = () => this.performAction('startGame');

        const closeCardBtn = document.getElementById('close-card-btn');
        if (closeCardBtn) {
            closeCardBtn.onclick = () => {
                document.getElementById('card-modal').classList.add('hidden');
            };
        }

        // Auction buttons
        const placeBidBtn = document.getElementById('place-bid-btn');
        if (placeBidBtn) placeBidBtn.onclick = () => {
            const bidAmount = parseInt(document.getElementById('bid-input').value) || 0;
            this.performAction('placeBid', { bidAmount });
        };
        const foldBtn = document.getElementById('fold-btn');
        if (foldBtn) foldBtn.onclick = () => this.performAction('foldAuction');

        // Trade button
        const tradeBtn = document.getElementById('trade-btn');
        if (tradeBtn) tradeBtn.onclick = () => this.openTradeModal();

        // Trade modal buttons
        const sendTradeBtn = document.getElementById('send-trade-btn');
        if (sendTradeBtn) sendTradeBtn.onclick = () => this.sendTradeOffer();
        const acceptTradeBtn = document.getElementById('accept-trade-btn');
        if (acceptTradeBtn) acceptTradeBtn.onclick = () => this.performAction('acceptTrade');
        const rejectTradeBtn = document.getElementById('reject-trade-btn');
        if (rejectTradeBtn) rejectTradeBtn.onclick = () => this.performAction('rejectTrade');
        const cancelTradeBtn = document.getElementById('cancel-trade-btn');
        if (cancelTradeBtn) cancelTradeBtn.onclick = () => {
            document.getElementById('trade-modal').classList.add('hidden');
            this.performAction('cancelTradePhase');
        };
        
        // Chat
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.onkeydown = (e) => {
                if (e.key === 'Enter' && chatInput.value.trim()) {
                    this.sendChat(chatInput.value);
                    chatInput.value = '';
                }
            };
        }
    }

    openTradeModal() {
        if (!this.state || !this.state.gameStarted) return;
        this.performAction('requestTradePhase');
        const modal = document.getElementById('trade-modal');
        const select = document.getElementById('trade-player-select');
        const offeredProps = document.getElementById('trade-props-offered');
        const requestedProps = document.getElementById('trade-props-requested');
        
        // Populate player dropdown
        select.innerHTML = this.state.players
            .filter(p => p.id !== this.playerId && !p.eliminated)
            .map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        
        // Populate my properties
        const me = this.state.players.find(p => p.id === this.playerId);
        offeredProps.innerHTML = this.state.board.map((t, i) => {
            if (t.owner === this.playerId && t.houses === 0) {
                return `<label><input type="checkbox" value="${i}"> ${t.name}</label>`;
            }
            return '';
        }).join('');

        // Update requested props when target player changes
        const updateRequested = () => {
            const targetId = select.value;
            requestedProps.innerHTML = this.state.board.map((t, i) => {
                if (t.owner === targetId && t.houses === 0) {
                    return `<label><input type="checkbox" value="${i}"> ${t.name}</label>`;
                }
                return '';
            }).join('');
        };
        select.onchange = updateRequested;
        updateRequested();
        
        // Show setup, hide accept/reject
        document.getElementById('trade-setup-area').classList.remove('hidden');
        document.getElementById('send-trade-btn').classList.remove('hidden');
        document.getElementById('accept-trade-btn').classList.add('hidden');
        document.getElementById('reject-trade-btn').classList.add('hidden');
        modal.classList.remove('hidden');
    }

    sendTradeOffer() {
        const toPlayerId = document.getElementById('trade-player-select').value;
        const giveCash = parseInt(document.getElementById('trade-cash-offered').value) || 0;
        const getCash = parseInt(document.getElementById('trade-cash-requested').value) || 0;
        const giveProps = Array.from(document.querySelectorAll('#trade-props-offered input:checked')).map(cb => parseInt(cb.value));
        const getProps = Array.from(document.querySelectorAll('#trade-props-requested input:checked')).map(cb => parseInt(cb.value));
        
        this.performAction('offerTrade', { toPlayerId, offer: { giveCash, getCash, giveProps, getProps } });
        document.getElementById('trade-modal').classList.add('hidden');
    }

    async sendChat(message) {
        const { db, ref, push } = window.fbDB;
        const me = this.state.players.find(p => p.id === this.playerId);
        const chatRef = ref(db, `rooms/${this.roomId}/chats`);
        await push(chatRef, {
            name: me.name,
            color: me.color,
            message: message,
            timestamp: Date.now()
        });
    }

    listenToChats(roomId) {
        const { db, ref, onChildAdded } = window.fbDB;
        const chatRef = ref(db, `rooms/${roomId}/chats`);
        // Note: script.js might not have onChildAdded directly exposed, using onValue for simplicity
        const { onValue } = window.fbDB;
        onValue(chatRef, (snapshot) => {
            const chats = snapshot.val();
            const chatBox = document.getElementById('chat-messages');
            if (!chatBox || !chats) return;
            chatBox.innerHTML = ''; // Re-render for simplicity or use specific logic
            Object.values(chats).forEach(data => {
                const msgEl = document.createElement('div');
                msgEl.className = 'chat-msg';
                msgEl.innerHTML = `<span style="color:${data.color};font-weight:700;">${data.name}:</span> ${data.message}`;
                chatBox.appendChild(msgEl);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

    async performAction(actionType, data = {}) {
        const { runTransaction, ref, db } = window.fbDB;
        const roomRef = ref(db, `rooms/${this.roomId}`);

        await runTransaction(roomRef, (state) => {
            if (!state) return state;
            
            const player = state.players.find(p => p.id === this.playerId);
            if (!player) return state;
            const isMyTurn = state.players[state.turnIndex] && state.players[state.turnIndex].id === this.playerId;

            if (actionType === 'toggleReady') {
                player.ready = !player.ready;
                addLog(state, `${player.name} is ${player.ready ? 'READY ✅' : 'NOT READY ⏳'}`);
            } else if (actionType === 'startGame') {
                if (state.players[0].id === this.playerId) {
                    state.gameStarted = true;
                    state.phase = 'roll';
                    state.turnIndex = 0;
                    addLog(state, `Game started by ${player.name}!`);
                }
            } else if (actionType === 'payJail') {
                if (player.inJail) {
                    if (player.getOutOfJailFreeCards && player.getOutOfJailFreeCards > 0) {
                        player.getOutOfJailFreeCards--;
                        player.inJail = false;
                        player.jailTurns = 0;
                        player.status = 'waiting';
                        addLog(state, `${player.name} used a Get Out of Jail Free card!`);
                    } else if (player.money >= 50) {
                        player.money -= 50;
                        player.inJail = false;
                        player.jailTurns = 0;
                        player.status = 'waiting';
                        addLog(state, `${player.name} paid $50 to leave Jail!`);
                    }
                }
            } else if (actionType === 'buyHouse') {
                const tileIndex = data.tileIndex;
                const tile = state.board[tileIndex];
                if (tile && tile.type === 'property' && tile.owner === this.playerId && player.money >= tile.housePrice && tile.houses < 5 && !tile.mortgaged) {
                    const groupTiles = state.board.filter(t => t.group === tile.group);
                    const ownsAll = groupTiles.every(t => t.owner === this.playerId && !t.mortgaged);
                    if (ownsAll) {
                        const minHouses = Math.min(...groupTiles.map(t => t.houses));
                        if (tile.houses <= minHouses) {
                            player.money -= tile.housePrice;
                            tile.houses++;
                            addLog(state, `${player.name} upgraded ${tile.name} (${tile.houses === 5 ? 'Hotel' : tile.houses + ' Houses'})`);
                        }
                    }
                }
            } else if (actionType === 'mortgageProperty') {
                const tileIndex = data.tileIndex;
                const tile = state.board[tileIndex];
                if (tile && tile.owner === this.playerId && !tile.mortgaged && tile.houses === 0) {
                    tile.mortgaged = true;
                    const val = Math.floor(tile.price / 2);
                    player.money += val;
                    addLog(state, `${player.name} mortgaged ${tile.name} for $${val}`);
                }
            } else if (actionType === 'unmortgageProperty') {
                const tileIndex = data.tileIndex;
                const tile = state.board[tileIndex];
                const cost = Math.floor((tile.price / 2) * 1.1);
                if (tile && tile.owner === this.playerId && tile.mortgaged && player.money >= cost) {
                    player.money -= cost;
                    tile.mortgaged = false;
                    addLog(state, `${player.name} unmortgaged ${tile.name} for $${cost}`);
                }
            } else if (actionType === 'placeBid') {
                if (state.phase === 'auction' && state.auction) {
                    const bidAmount = data.bidAmount;
                    if (!state.auction.participants) state.auction.participants = [];
                    if (state.auction.participants.includes(this.playerId) && bidAmount > state.auction.highestBid && player.money >= bidAmount) {
                        state.auction.highestBid = bidAmount;
                        state.auction.highestBidderId = this.playerId;
                        addLog(state, `${player.name} bid $${bidAmount}`);
                    }
                }
            } else if (actionType === 'foldAuction') {
                if (state.phase === 'auction' && state.auction) {
                    if (!state.auction.participants) state.auction.participants = [];
                    state.auction.participants = state.auction.participants.filter(id => id !== this.playerId);
                    addLog(state, `${player.name} folded.`);
                    if (state.auction.participants.length <= 1) {
                        this.finishAuctionLogic(state);
                    }
                }
            } else if (actionType === 'requestTradePhase') {
                if (state.phase !== 'trade' && !state.activeTrade) {
                    state.previousPhase = state.phase;
                    state.phase = 'trade';
                    state.tradeRequesterId = this.playerId;
                }
            } else if (actionType === 'cancelTradePhase') {
                if (state.phase === 'trade' && !state.activeTrade) {
                    state.phase = state.previousPhase || 'roll';
                    state.tradeRequesterId = null;
                }
            } else if (actionType === 'offerTrade') {
                if (state.phase === 'trade' && !state.activeTrade) {
                    const { toPlayerId, offer } = data;
                    const toPlayer = state.players.find(p => p.id === toPlayerId);
                    if (toPlayer && player.money >= offer.giveCash) {
                        state.activeTrade = {
                            from: { id: player.id, name: player.name },
                            to: { id: toPlayer.id, name: toPlayer.name },
                            offer, status: 'pending'
                        };
                        addLog(state, `${player.name} offered a trade to ${toPlayer.name}`);
                    }
                }
            } else if (actionType === 'acceptTrade') {
                if (state.activeTrade && state.activeTrade.to.id === this.playerId) {
                    const trade = state.activeTrade;
                    const p1 = state.players.find(p => p.id === trade.from.id);
                    const p2 = state.players.find(p => p.id === trade.to.id);
                    const offer = trade.offer;
                    if (p1 && p2 && p1.money >= offer.giveCash && p2.money >= offer.getCash) {
                        p1.money = p1.money - offer.giveCash + offer.getCash;
                        p2.money = p2.money - offer.getCash + offer.giveCash;
                        if (offer.giveProps) offer.giveProps.forEach(idx => { const t = state.board[idx]; if(t) { t.owner = p2.id; p1.properties = (p1.properties||[]).filter(n=>n!==t.name); p2.properties = p2.properties||[]; p2.properties.push(t.name); }});
                        if (offer.getProps) offer.getProps.forEach(idx => { const t = state.board[idx]; if(t) { t.owner = p1.id; p2.properties = (p2.properties||[]).filter(n=>n!==t.name); p1.properties = p1.properties||[]; p1.properties.push(t.name); }});
                        addLog(state, `Trade completed between ${p1.name} and ${p2.name}`);
                    }
                    state.activeTrade = null;
                    state.phase = state.previousPhase || 'roll';
                    state.tradeRequesterId = null;
                }
            } else if (actionType === 'rejectTrade') {
                if (state.activeTrade && (state.activeTrade.to.id === this.playerId || state.activeTrade.from.id === this.playerId)) {
                    addLog(state, 'Trade offer rejected.');
                    state.activeTrade = null;
                    state.phase = state.previousPhase || 'roll';
                    state.tradeRequesterId = null;
                }
            } else if (isMyTurn) {
                if (actionType === 'rollDice' && state.phase === 'roll') {
                    this.handleRollLogic(state, player);
                    this.checkBankruptcyLogic(state, player);
                    this.checkWinnerLogic(state);
                } else if (actionType === 'buyProperty' && state.phase === 'action') {
                    this.handleBuyLogic(state, player);
                } else if (actionType === 'passProperty' && state.phase === 'action') {
                    addLog(state, `${player.name} chose not to buy. Starting auction!`);
                    state.phase = 'auction';
                    state.auction = {
                        tileIndex: player.position,
                        highestBid: 10,
                        highestBidderId: null,
                        participants: state.players.filter(p => !p.eliminated).map(p => p.id)
                    };
                } else if (actionType === 'endTurn' && state.phase === 'end') {
                    this.handleEndTurnLogic(state, player);
                }
            }
            return state;
        });
    }

    movePlayerLogic(state, player, steps) {
        const oldPos = player.position;
        player.position = (player.position + steps) % 40;
        if (player.position < oldPos) {
            player.money += 200;
            player.status = 'reward';
            addLog(state, `${player.name} passed GO and collected $200`);
        } else {
            if (player.status === 'reward') player.status = 'waiting';
        }
        this.handleTileLogic(state, player);
    }

    handleTileLogic(state, player) {
        const tile = state.board[player.position];
        addLog(state, `${player.name} landed on ${tile.name}`);

        if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
            if (!tile.owner) {
                state.phase = 'action';
            } else if (tile.owner !== player.id) {
                const owner = state.players.find(p => p.id === tile.owner);
                if (owner && !owner.eliminated) {
                    if (tile.mortgaged) {
                        addLog(state, `${tile.name} is mortgaged — no rent collected.`);
                    } else {
                        const rent = this.calculateRent(state, tile, player);
                        player.money -= rent;
                        owner.money += rent;
                        addLog(state, `${player.name} paid $${rent} rent to ${owner.name} for ${tile.name}.`);
                    }
                }
                state.phase = 'end';
            } else {
                state.phase = 'end';
            }
        } else {
            switch (tile.type) {
                case 'tax':
                    player.money -= tile.price;
                    addLog(state, `${player.name} paid $${tile.price} in taxes (${tile.name}).`);
                    state.phase = 'end';
                    break;
                case 'gotojail':
                    player.inJail = true;
                    player.position = 10;
                    player.status = 'jail';
                    addLog(state, `${player.name} is sent to Jail!`);
                    state.phase = 'end';
                    break;
                case 'chance': {
                    const card = HELLFIRE_CLUB_CARDS[Math.floor(Math.random() * HELLFIRE_CLUB_CARDS.length)];
                    addLog(state, `${player.name} drew from Hellfire Club: ${card.text}`);
                    card.action(state, player);
                    state.phase = 'end';
                    state.lastDrawnCard = { type: 'chance', text: card.text };
                    break;
                }
                case 'chest': {
                    const card = CEREBRO_CARDS[Math.floor(Math.random() * CEREBRO_CARDS.length)];
                    addLog(state, `${player.name} drew from Cerebro: ${card.text}`);
                    card.action(state, player);
                    state.phase = 'end';
                    state.lastDrawnCard = { type: 'chest', text: card.text };
                    break;
                }
                default:
                    player.status = 'waiting';
                    state.phase = 'end';
                    break;
            }
        }
    }

    calculateRent(state, tile, player) {
        if (tile.mortgaged) return 0;
        if (tile.type === 'property') {
            let rent = tile.rent[tile.houses];
            if (tile.houses === 0) {
                const groupTiles = state.board.filter(t => t.group === tile.group);
                if (groupTiles.every(t => t.owner === tile.owner && !t.mortgaged)) rent *= 2;
            }
            return rent;
        } else if (tile.type === 'railroad') {
            const ownedCount = state.board.filter(t => t.type === 'railroad' && t.owner === tile.owner).length;
            return tile.rent[ownedCount - 1];
        } else if (tile.type === 'utility') {
            const ownedCount = state.board.filter(t => t.type === 'utility' && t.owner === tile.owner).length;
            const rollTotal = (state.lastRoll[0] || 0) + (state.lastRoll[1] || 0) || 7;
            return (ownedCount === 1 ? 4 : 10) * rollTotal;
        }
        return 0;
    }

    handleRollLogic(state, player) {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        const isDoubles = d1 === d2;
        state.lastRoll = [d1, d2];
        addLog(state, `${player.name} rolled ${total} (${d1}+${d2})`);

        if (isDoubles) {
            state.doubleCount = (state.doubleCount || 0) + 1;
            if (state.doubleCount >= 3) {
                player.inJail = true;
                player.position = 10;
                player.status = 'jail';
                state.doubleCount = 0;
                addLog(state, `${player.name} sent to Jail for 3 doubles!`);
                state.phase = 'end';
            } else if (player.inJail) {
                player.inJail = false;
                player.jailTurns = 0;
                addLog(state, `${player.name} rolled doubles and escaped Jail!`);
                this.movePlayerLogic(state, player, total);
            } else {
                this.movePlayerLogic(state, player, total);
                addLog(state, `${player.name} gets another turn for doubles!`);
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
                    this.movePlayerLogic(state, player, total);
                } else {
                    addLog(state, `${player.name} remains in Jail. (Turn ${player.jailTurns}/3)`);
                    state.phase = 'end';
                }
            } else {
                this.movePlayerLogic(state, player, total);
            }
        }
    }

    handleBuyLogic(state, player) {
        const tile = state.board[player.position];
        if (player.money >= tile.price) {
            player.money -= tile.price;
            tile.owner = player.id;
            if (!player.properties) player.properties = [];
            player.properties.push(tile.name);
            addLog(state, `${player.name} bought ${tile.name} for $${tile.price}`);
            state.phase = 'end';
            state.lastBoughtProperty = { tileIndex: player.position, buyerId: player.id };
        }
    }

    handleEndTurnLogic(state, player) {
        if (state.doubleCount > 0 && !player.inJail && !player.eliminated) {
            state.phase = 'roll';
            addLog(state, `${player.name} gets another roll for doubles!`);
        } else {
            if (player.status !== 'jail') player.status = 'waiting';
            do {
                state.turnIndex = (state.turnIndex + 1) % state.players.length;
            } while (state.players[state.turnIndex].eliminated);
            state.phase = 'roll';
            state.doubleCount = 0;
            addLog(state, `It's now ${state.players[state.turnIndex].name}'s turn.`);
        }
    }

    finishAuctionLogic(state) {
        if (!state.auction) return;
        if (state.auction.highestBidderId) {
            const winner = state.players.find(p => p.id === state.auction.highestBidderId);
            const tile = state.board[state.auction.tileIndex];
            if (winner && winner.money >= state.auction.highestBid) {
                winner.money -= state.auction.highestBid;
                tile.owner = winner.id;
                if (!winner.properties) winner.properties = [];
                winner.properties.push(tile.name);
                addLog(state, `${winner.name} won ${tile.name} in auction for $${state.auction.highestBid}`);
                state.lastBoughtProperty = { tileIndex: state.auction.tileIndex, buyerId: winner.id };
            }
        } else {
            addLog(state, `No one bid on ${state.board[state.auction.tileIndex].name}. Property remains unowned.`);
        }
        state.auction = null;
        state.phase = 'end';
    }

    checkBankruptcyLogic(state, player) {
        if (player.money < 0 && !player.eliminated) {
            let assets = 0;
            state.board.forEach(tile => {
                if (tile.owner === player.id) {
                    assets += tile.mortgaged ? 0 : Math.floor(tile.price / 2);
                    assets += (tile.houses || 0) * (tile.housePrice || 0);
                }
            });
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
            }
        }
    }

    checkWinnerLogic(state) {
        const activePlayers = state.players.filter(p => !p.eliminated);
        if (activePlayers.length === 1 && state.gameStarted) {
            state.winner = activePlayers[0].name;
            addLog(state, `GAME OVER! ${state.winner} WINS!`);
        }
    }

    handleStateUpdate(state) {
        const oldState = this.state;
        this.state = state;
        
        if (!this.roomId && state.roomId) this.roomId = state.roomId;

        const isStarted = this.state.gameStarted;
        if (document.getElementById('main-game-container').classList.contains('hidden')) {
            this.showGameScreen();
        }
        
        document.getElementById('lobby-view').classList.toggle('hidden', isStarted);
        document.getElementById('board-view').classList.toggle('hidden', !isStarted);

        // Handle private deed display after purchase
        if (state.lastBoughtProperty && state.lastBoughtProperty.buyerId === this.playerId) {
            if (!oldState || !oldState.lastBoughtProperty || oldState.lastBoughtProperty.tileIndex !== state.lastBoughtProperty.tileIndex) {
                const tile = state.board[state.lastBoughtProperty.tileIndex];
                this.showDeedModal(tile);
            }
        }
    }

    showDeedModal(tile) {
        const modal = document.getElementById('deed-overlay');
        if (!modal) return;

        document.getElementById('deed-property-name').innerText = tile.name.toUpperCase();
        
        // Handle different property types
        const rentBase = document.getElementById('deed-rent-base');
        const rent1 = document.getElementById('deed-rent-1');
        const rent2 = document.getElementById('deed-rent-2');
        const rent3 = document.getElementById('deed-rent-3');
        const rent4 = document.getElementById('deed-rent-4');
        const rentHotel = document.getElementById('deed-rent-hotel');
        const houseCost = document.getElementById('deed-house-cost');
        const hotelCost = document.getElementById('deed-hotel-cost');
        const mortgageVal = document.getElementById('deed-mortgage-value');
        const titleBar = document.getElementById('deed-title-bar');

        // Reset display
        [rentBase, rent1, rent2, rent3, rent4, rentHotel, houseCost, hotelCost].forEach(el => {
            if (el && el.parentElement) el.parentElement.style.display = 'flex';
        });

        if (tile.type === 'property') {
            titleBar.style.backgroundColor = this.getGroupColor(tile.group);
            rentBase.innerText = `$${tile.rent[0]}`;
            rent1.innerText = `$${tile.rent[1]}`;
            rent2.innerText = `$${tile.rent[2]}`;
            rent3.innerText = `$${tile.rent[3]}`;
            rent4.innerText = `$${tile.rent[4]}`;
            rentHotel.innerText = `$${tile.rent[5]}`;
            houseCost.innerText = `$${tile.housePrice} each`;
            hotelCost.innerText = `$${tile.housePrice} + 4 Houses`;
            mortgageVal.innerText = `$${Math.floor(tile.price / 2)}`;
        } else if (tile.type === 'railroad') {
            titleBar.style.backgroundColor = '#333';
            rentBase.innerText = '$25';
            rent1.innerText = '$50';
            rent2.innerText = '$100';
            rent3.innerText = '$200';
            [rent4, rentHotel, houseCost, hotelCost].forEach(el => {
                if (el && el.parentElement) el.parentElement.style.display = 'none';
            });
            mortgageVal.innerText = '$100';
        } else if (tile.type === 'utility') {
            titleBar.style.backgroundColor = '#444';
            rentBase.innerText = '4x Roll if 1 Utility owned';
            rent1.innerText = '10x Roll if 2 Utilities owned';
            [rent2, rent3, rent4, rentHotel, houseCost, hotelCost].forEach(el => {
                if (el && el.parentElement) el.parentElement.style.display = 'none';
            });
            mortgageVal.innerText = '$75';
        }

        modal.classList.remove('hidden');
        
        // Close on click outside or after delay
        const closeDeed = (e) => {
            modal.classList.add('hidden');
            window.removeEventListener('mousedown', closeDeed);
        };
        setTimeout(() => window.addEventListener('mousedown', closeDeed), 100);
    }

        getGroupColor(group) {
        const colors = {
            brown: '#8b4513',
            lightblue: '#87ceeb',
            pink: '#ff69b4',
            orange: '#ffa500',
            red: '#ff0000',
            yellow: '#ffff00',
            green: '#008000',
            darkblue: '#00008b'
        };
        return colors[group] || '#ccc';
    }

    handleStateUpdate(state) {
        const oldState = this.state;
        this.state = state;
        
        if (!this.roomId && state.roomId) this.roomId = state.roomId;

        const isStarted = this.state.gameStarted;
        if (document.getElementById('main-game-container').classList.contains('hidden')) {
            this.showGameScreen();
        }
        
        document.getElementById('lobby-view').classList.toggle('hidden', isStarted);
        document.getElementById('board-view').classList.toggle('hidden', !isStarted);

        // Handle private deed display after purchase
        if (state.lastBoughtProperty && state.lastBoughtProperty.buyerId === this.playerId) {
            if (!oldState || !oldState.lastBoughtProperty || oldState.lastBoughtProperty.tileIndex !== state.lastBoughtProperty.tileIndex) {
                const tile = state.board[state.lastBoughtProperty.tileIndex];
                this.showDeedModal(tile);
            }
        }

        if (!isStarted) this.renderCharacterSelector();
        
        if (isStarted && !this.boardCreated) {
            this.createBoardUI();
            this.boardCreated = true;
        }

        if (oldState) {
            this.handleAnimations(oldState, state);
            if (state.lastDrawnCard && (!oldState.lastDrawnCard || state.lastDrawnCard.text !== oldState.lastDrawnCard.text)) {
                this.handleCardDrawn(state.lastDrawnCard.type, state.lastDrawnCard.text);
            }
        }

        this.updateUI();
    }

    async handleAnimations(oldState, state) {
        const movedPlayerIndex = state.players.findIndex((p, i) => {
            if (!oldState.players[i]) return false;
            return p.position !== oldState.players[i].position;
        });
        
        if (movedPlayerIndex !== -1 && !this.isMoving) {
            this.isMoving = true;
            await this.animateMovement(movedPlayerIndex, oldState.players[movedPlayerIndex].position, state.players[movedPlayerIndex].position);
            this.isMoving = false;
        }
    }

    async animateMovement(playerIdx, from, to) {
        this.updateTokenPositions();
        const steps = (to - from + 40) % 40;
        let current = from;
        for (let i = 0; i < steps; i++) {
            current = (current + 1) % 40;
            // Immediate jump to next tile
            this.moveTokenToTile(playerIdx, current);
            
            // Add a small "hop" effect using a temporary CSS class or direct style
            const token = document.getElementById(`token-${playerIdx}`);
            if (token) {
                token.style.transition = 'left 0.2s ease-out, top 0.2s ease-out, transform 0.1s ease-out';
                token.style.transform = 'translate(-50%, -100%) scale(1.2)'; // Lift up
                setTimeout(() => {
                    token.style.transform = 'translate(-50%, -50%) scale(1)'; // Land down
                }, 100);
            }

            Sound.dice();
            await new Promise(r => setTimeout(r, 300)); // Slightly longer delay for the hop
        }
        this.updateTokenPositions();
    }

    showGameScreen() {
        document.getElementById('lobby-screen').classList.add('hidden');
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('main-game-container').classList.remove('hidden');
        
        const isStarted = this.state.gameStarted;
        document.getElementById('lobby-view').classList.toggle('hidden', isStarted);
        document.getElementById('board-view').classList.toggle('hidden', !isStarted);

        const roomDisplay = document.getElementById('room-display');
        roomDisplay.innerText = this.roomId;
        
        document.getElementById('copy-room-btn').onclick = () => {
            navigator.clipboard.writeText(this.roomId);
            this.notify("Room ID copied to clipboard!", "success");
        };
    }

    createBoardUI() {
        const boardEl = document.getElementById('monopoly-board');
        boardEl.querySelectorAll('.tile').forEach(t => t.remove());

        this.state.board.forEach((tile, index) => {
            const tileEl = document.createElement('div');
            tileEl.className = `tile ${tile.type}`;
            if (tile.group) tileEl.classList.add(`group-${tile.group}`);
            tileEl.id = `tile-${index}`;
            this.renderTile(tileEl, tile, index);
            
            let row, col;
            if (index >= 0 && index <= 10) { row = 11; col = 11 - index; }
            else if (index > 10 && index < 20) { row = 11 - (index - 10); col = 1; }
            else if (index >= 20 && index <= 30) { row = 1; col = index - 19; }
            else { row = index - 29; col = 11; }
            
            tileEl.style.gridRow = row;
            tileEl.style.gridColumn = col;
            boardEl.appendChild(tileEl);
        });
    }

    renderTile(tileEl, tile, index) {
        const owner = tile.owner ? this.state.players.find(p => p.id === tile.owner) : null;
        tileEl.innerHTML = `
            <div class="tile-name">${tile.name}</div>
            ${tile.houses > 0 ? `<div class="houses">${tile.houses === 5 ? '🏨' : '🏠'.repeat(tile.houses)}</div>` : ''}
            ${tile.mortgaged ? '<div class="mortgage-tag">MORTGAGED</div>' : ''}
            ${tile.price ? `<div class="price">$${tile.price}</div>` : ''}
        `;
        if (owner) {
            tileEl.style.backgroundColor = `${owner.color}33`;
        }
    }

    updateUI() {
        const rollBtn = document.getElementById('roll-btn');
        const buyBtn = document.getElementById('buy-btn');
        const passBtn = document.getElementById('pass-btn');
        const endTurnBtn = document.getElementById('end-turn-btn');
        const tradeBtn = document.getElementById('trade-btn');
        const startBtn = document.getElementById('start-game-btn');
        const readyBtn = document.getElementById('ready-btn');
        const auctionPanel = document.getElementById('auction-panel');
        
        const currentPlayer = this.state.players[this.state.turnIndex];
        const me = this.state.players.find(p => p.id === this.playerId);
        const isMyTurn = currentPlayer && currentPlayer.id === this.playerId;

        const statusEl = document.getElementById('turn-status');
        if (statusEl) {
            if (!this.state.gameStarted) statusEl.innerText = "Waiting for game to start...";
            else if (this.state.winner) statusEl.innerText = `🏆 Winner: ${this.state.winner}!`;
            else if (this.state.phase === 'auction') statusEl.innerText = "AUCTION IN PROGRESS";
            else statusEl.innerText = isMyTurn ? "Your Turn!" : `${currentPlayer.name}'s Turn`;
        }

        const btns = [rollBtn, buyBtn, passBtn, endTurnBtn, tradeBtn];
        btns.forEach(b => { if(b) b.classList.add('hidden'); });

        if (this.state.gameStarted && !this.state.winner && isMyTurn) {
            // Only show Trade if no auction is in progress and no active trade is pending
            const canTrade = this.state.phase !== 'auction' && !this.state.activeTrade;
            if (tradeBtn && canTrade) tradeBtn.classList.remove('hidden');

            if (this.state.phase === 'roll') rollBtn.classList.remove('hidden');
            if (this.state.phase === 'action') { buyBtn.classList.remove('hidden'); passBtn.classList.remove('hidden'); }
            if (this.state.phase === 'end') endTurnBtn.classList.remove('hidden');
        }

        // Auction panel
        if (auctionPanel) {
            if (this.state.phase === 'auction' && this.state.auction) {
                auctionPanel.classList.remove('hidden');
                const a = this.state.auction;
                document.getElementById('auction-title').innerText = `Auction: ${this.state.board[a.tileIndex].name}`;
                document.getElementById('highest-bid').innerText = a.highestBid;
                const bidder = a.highestBidderId ? this.state.players.find(p => p.id === a.highestBidderId) : null;
                document.getElementById('highest-bidder').innerText = bidder ? bidder.name : 'None';
            } else {
                auctionPanel.classList.add('hidden');
            }
        }

        // Trade proposal received
        if (this.state.activeTrade && this.state.activeTrade.to.id === this.playerId && this.state.activeTrade.status === 'pending') {
            const tradeModal = document.getElementById('trade-modal');
            const title = document.getElementById('trade-modal-title');
            title.innerText = `Trade from ${this.state.activeTrade.from.name}`;
            document.getElementById('trade-setup-area').classList.add('hidden');
            document.getElementById('send-trade-btn').classList.add('hidden');
            document.getElementById('accept-trade-btn').classList.remove('hidden');
            document.getElementById('reject-trade-btn').classList.remove('hidden');
            
            const offer = this.state.activeTrade.offer;
            const display = document.getElementById('trade-offer-display');
            const displayText = display.querySelector('.trade-offer-text');
            let html = '';
            if (offer.giveCash > 0) html += `<p>They offer: $${offer.giveCash}</p>`;
            if (offer.getCash > 0) html += `<p>They want: $${offer.getCash}</p>`;
            if (offer.giveProps && offer.giveProps.length > 0) html += `<p>They offer: ${offer.giveProps.map(i => this.state.board[i].name).join(', ')}</p>`;
            if (offer.getProps && offer.getProps.length > 0) html += `<p>They want: ${offer.getProps.map(i => this.state.board[i].name).join(', ')}</p>`;
            displayText.innerHTML = html;
            display.classList.remove('hidden');
            tradeModal.classList.remove('hidden');
        }

        if (startBtn) {
            const isHost = this.state.players[0].id === this.playerId;
            startBtn.classList.toggle('hidden', this.state.gameStarted || !isHost);
        }

        if (readyBtn) {
            readyBtn.classList.toggle('hidden', this.state.gameStarted);
            readyBtn.innerText = me?.ready ? "I'm Ready! ✅" : "Ready?";
        }

        // Game log
        const logEl = document.getElementById('game-log');
        if (logEl && this.state.logs) {
            logEl.innerHTML = this.state.logs.map(l => `<div class="log-entry">${l}</div>`).join('');
        }

        // Update board tiles (ownership, houses)
        if (this.state.gameStarted && this.boardCreated) {
            this.state.board.forEach((tile, index) => {
                const tileEl = document.getElementById(`tile-${index}`);
                if (tileEl) this.renderTile(tileEl, tile, index);
            });
        }

        // Update bank/currency panel
        this.renderCurrency();

        // Update player list and tokens
        this.updatePlayerList();
        this.updateTokenPositions();
    }

    renderCurrency() {
        const currencyDisplay = document.getElementById('currency-display');
        if (!currencyDisplay || !this.state) return;

        const me = this.state.players.find(p => p.id === this.playerId);
        const money = me ? Math.max(0, Math.floor(me.money)) : 0;

        const denominations = [
            { value: 1000, name: '1000', img: '/Currency/Vecna M1000.png' },
            { value: 500, name: '500', img: '/Currency/Mind Flayer M500.jpg' },
            { value: 100, name: '100', img: '/Currency/Demogorgon M100.png' },
            { value: 50, name: '50', img: '/Currency/Jim M50.png' },
            { value: 20, name: '20', img: '/Currency/Eleven M20.png' },
            { value: 10, name: '10', img: '/Currency/Mike M10.png' },
            { value: 5, name: '5', img: '/Currency/Dustin M5.png' },
            { value: 1, name: '1', img: '/Currency/Will M1.png' },
        ];

        let remaining = money;
        let html = `
            <div class="currency-summary" style="font-size:12px; margin-bottom:6px; color:#fff;">
                <strong>Player:</strong> ${me ? me.name : 'N/A'} &nbsp;|&nbsp; <strong>Money:</strong> $${money}
            </div>
        `;

        denominations.forEach(d => {
            const count = Math.floor(remaining / d.value);
            remaining -= count * d.value;
            const isEmpty = count === 0;

            html += `
                <div class="currency-item ${isEmpty ? 'empty' : ''}" title="${count} x ${d.value}">
                    <img src="${d.img}" alt="${d.value}">
                    <div class="currency-count">${count}</div>
                </div>
            `;
        });

        if (remaining > 0) {
            html += `<div style="font-size:11px;color:#f9d142;margin-top:4px;">Unallocated: $${remaining}</div>`;
        }

        currencyDisplay.innerHTML = html;
    }

    updatePlayerList() {
        const list = document.getElementById('player-list');
        if (!list) return;
        list.innerHTML = this.state.players.map((p, i) => `
            <div class="player-card ${i === this.state.turnIndex ? 'active-turn' : ''} ${p.id === this.playerId ? 'me' : ''}">
                <div class="player-avatar" style="background:${p.color}"></div>
                <div class="player-info">
                    <div class="player-name">${p.name} ${p.eliminated ? '(OUT)' : ''}</div>
                    <div class="player-money">$${p.money}</div>
                </div>
            </div>
        `).join('');
    }

    updateTokenPositions() {
        if (!this.state || !this.state.players) return;
        
        // Ensure board is visible before calculating positions
        const boardEl = document.getElementById('monopoly-board');
        if (!boardEl || boardEl.offsetParent === null) return;

        this.state.players.forEach((p, i) => {
            if (p.eliminated) {
                const existing = document.getElementById(`token-${i}`);
                if (existing) existing.remove();
                return;
            }
            let token = document.getElementById(`token-${i}`);
            if (!token) {
                token = document.createElement('div');
                token.id = `token-${i}`;
                token.className = 'token';

                const inner = document.createElement('div');
                inner.className = 'token-inner';
                token.appendChild(inner);

                document.getElementById('monopoly-board').appendChild(token);
            }

            const inner = token.querySelector('.token-inner');
            if (inner && p.character) {
                const imgPath = `/Characters/${p.character.folder}/${p.character.file}`;
                inner.style.backgroundImage = `url('${imgPath}')`;
            }

            // Sync color for the active turn glow
            token.style.setProperty('--glow-color', p.color);
            const isTurn = this.state.players[this.state.turnIndex] && this.state.players[this.state.turnIndex].id === p.id;
            token.classList.toggle('active-turn-token', isTurn);

            if (!this.isMoving) {
                this.moveTokenToTile(i, p.position);
            }
        });
    }

    moveTokenToTile(playerIdx, tileIndex) {
        const token = document.getElementById(`token-${playerIdx}`);
        if (!token) return;
        const tileEl = document.getElementById(`tile-${tileIndex}`);
        if (!tileEl) return;
        const boardRect = document.getElementById('monopoly-board').getBoundingClientRect();
        const tileRect = tileEl.getBoundingClientRect();
        token.style.left = `${(tileRect.left - boardRect.left) + tileRect.width / 2}px`;
        token.style.top = `${(tileRect.top - boardRect.top) + tileRect.height / 2}px`;
    }

    handleCardDrawn(type, text) {
        const modal = document.getElementById('card-modal');
        const title = document.getElementById('card-type-title');
        const desc = document.getElementById('card-description-text');
        title.innerText = type === 'chest' ? 'CEREBRO' : 'HELLFIRE CLUB';
        desc.innerText = text;
        modal.classList.remove('hidden');
        Sound.money();
    }

    notify(msg, type = "info") {
        const container = document.getElementById('notifications');
        const n = document.createElement('div');
        n.className = `notification ${type}`;
        n.innerText = msg;
        container.appendChild(n);
        setTimeout(() => n.remove(), 4000);
    }

    joinSpecificRoom(roomId) {
        document.getElementById('rooms-modal').classList.add('hidden');
        document.getElementById('room-id-input').value = roomId;
        this.joinRoom(roomId);
    }

    renderCharacterSelector() {
        const container = document.getElementById('character-selector');
        if (!container) return;
        
        const me = this.state.players.find(p => p.id === this.playerId);
        
        container.innerHTML = this.characters.map(char => {
            const isTaken = this.state.players.some(p => p.character?.id === char.id && p.id !== this.playerId);
            const isSelected = me?.character?.id === char.id;
            
            return `
                <div class="char-option ${isTaken ? 'taken' : ''} ${isSelected ? 'selected' : ''}" 
                     onclick="${!isTaken ? `app.selectCharacter('${char.id}')` : ''}">
                    <div class="char-img" style="background-image: url('/Characters/${char.folder}/${char.file}');"></div>
                    <div class="char-name">${char.name}</div>
                    ${isTaken ? '<div class="ready-badge">TAKEN</div>' : ''}
                </div>
            `;
        }).join('');
    }

    async selectCharacter(charId) {
        const char = this.characters.find(c => c.id === charId);
        if (!char) return;

        const { runTransaction, ref, db } = window.fbDB;
        const roomRef = ref(db, `rooms/${this.roomId}`);

        await runTransaction(roomRef, (state) => {
            if (!state) return state;
            const player = state.players.find(p => p.id === this.playerId);
            if (player) {
                player.character = char;
                player.color = char.color; // Sync player color with character color
                addLog(state, `${player.name} selected ${char.name}`);
            }
            return state;
        });
    }
}

// Make app global for onclick handlers
window.app = new MonopolyClient();
