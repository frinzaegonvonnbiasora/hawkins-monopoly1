import { Property, Item, LogEntry } from './types';

export const BOARD_SIZE = 40;

export const INITIAL_PROPERTIES: Property[] = [
  { id: '0', name: 'GO - COLLECT $200', type: 'GO', price: 0, rent: [], position: 0, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '1', name: 'BENNY\'S BURGERS', type: 'PROPERTY', price: 60, rent: [2, 10, 30, 90, 160, 250, 750], shedCost: 50, labCost: 50, color: '#964B00', group: 'BROWN', position: 1, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 30 },
  { id: '2', name: 'CEREBRO', type: 'COMMUNITY_CHEST', price: 0, rent: [], position: 2, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '3', name: 'THE QUARRY', type: 'PROPERTY', price: 60, rent: [4, 20, 60, 180, 320, 450, 950], shedCost: 50, labCost: 50, color: '#964B00', group: 'BROWN', position: 3, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 30 },
  { id: '4', name: 'INCOME TAX', type: 'TAX', price: 200, rent: [], position: 4, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '5', name: 'HAWKINS STATION', type: 'RAILROAD', price: 200, rent: [25, 50, 100, 200], position: 5, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 100 },
  { id: '6', name: 'MELVALD\'S GENERAL STORE', type: 'PROPERTY', price: 100, rent: [6, 30, 90, 270, 400, 550, 1050], shedCost: 50, labCost: 50, color: '#ADD8E6', group: 'LIGHTBLUE', position: 6, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 50 },
  { id: '7', name: 'HELLFIRE CLUB', type: 'CHANCE', price: 0, rent: [], position: 7, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '8', name: 'EDDIE’S TRAILER', type: 'PROPERTY', price: 60, rent: [4, 20, 60, 180, 320, 450, 950], shedCost: 50, labCost: 50, color: '#ADD8E6', group: 'LIGHTBLUE', position: 8, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 30 },
  { id: '9', name: 'EDDIE’S HOUSE', type: 'PROPERTY', price: 100, rent: [6, 30, 90, 270, 400, 550, 1050], shedCost: 50, labCost: 50, color: '#ADD8E6', group: 'LIGHTBLUE', position: 9, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 50 },
  { id: '10', name: 'JUST VISITING', type: 'JAIL', price: 0, rent: [], position: 10, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '11', name: 'THE PALACE ARCADE', type: 'PROPERTY', price: 140, rent: [10, 50, 150, 450, 625, 750, 1250], shedCost: 100, labCost: 100, color: '#FF00FF', group: 'PINK', position: 11, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 70 },
  { id: '12', name: 'HAWKINS POWER & LIGHT', type: 'UTILITY', price: 150, rent: [], position: 12, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 75 },
  { id: '13', name: 'THE CINEMA', type: 'PROPERTY', price: 140, rent: [10, 50, 150, 450, 625, 750, 1250], shedCost: 100, labCost: 100, color: '#FF00FF', group: 'PINK', position: 13, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 70 },
  { id: '14', name: 'STARCOURT MALL', type: 'PROPERTY', price: 160, rent: [12, 60, 180, 500, 700, 900, 1400], shedCost: 100, labCost: 100, color: '#FF00FF', group: 'PINK', position: 14, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 80 },
  { id: '15', name: 'HELLFIRE CLUB STATION', type: 'RAILROAD', price: 200, rent: [25, 50, 100, 200], position: 15, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 100 },
  { id: '16', name: 'BRADLEY\'S BIG BUY', type: 'PROPERTY', price: 180, rent: [14, 70, 200, 550, 750, 950, 1450], shedCost: 100, labCost: 100, color: '#FFA500', group: 'ORANGE', position: 16, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 90 },
  { id: '17', name: 'CEREBRO', type: 'COMMUNITY_CHEST', price: 0, rent: [], position: 17, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '18', name: 'HAWKINS POST', type: 'PROPERTY', price: 180, rent: [14, 70, 200, 550, 750, 950, 1450], shedCost: 100, labCost: 100, color: '#FFA500', group: 'ORANGE', position: 18, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 90 },
  { id: '19', name: 'HAWKINS COMMUNITY POOL', type: 'PROPERTY', price: 200, rent: [16, 80, 220, 600, 800, 1000, 1500], shedCost: 100, labCost: 100, color: '#FFA500', group: 'ORANGE', position: 19, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 100 },
  { id: '20', name: 'FREE PARKING', type: 'FREE_PARKING', price: 0, rent: [], position: 20, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '21', name: 'THE WHEELER HOUSE', type: 'PROPERTY', price: 220, rent: [18, 90, 250, 700, 875, 1050, 2050], shedCost: 150, labCost: 150, color: '#FF0000', group: 'RED', position: 21, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 110 },
  { id: '22', name: 'HELLFIRE CLUB', type: 'CHANCE', price: 0, rent: [], position: 22, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '23', name: 'THE SINCLAIR HOUSE', type: 'PROPERTY', price: 220, rent: [18, 90, 250, 700, 875, 1050, 2050], shedCost: 150, labCost: 150, color: '#FF0000', group: 'RED', position: 23, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 110 },
  { id: '24', name: 'THE BYERS HOUSE', type: 'PROPERTY', price: 240, rent: [20, 100, 300, 750, 925, 1100, 2100], shedCost: 150, labCost: 150, color: '#FF0000', group: 'RED', position: 24, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 120 },
  { id: '25', name: 'HAWKINS JUNCTION', type: 'RAILROAD', price: 200, rent: [25, 50, 100, 200], position: 25, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 100 },
  { id: '26', name: 'HAWKINS PUBLIC LIBRARY', type: 'PROPERTY', price: 260, rent: [22, 110, 330, 800, 975, 1150, 2150], shedCost: 150, labCost: 150, color: '#FFFF00', group: 'YELLOW', position: 26, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 130 },
  { id: '27', name: 'HAWKINS POLICE STATION', type: 'PROPERTY', price: 260, rent: [22, 110, 330, 800, 975, 1150, 2150], shedCost: 150, labCost: 150, color: '#FFFF00', group: 'YELLOW', position: 27, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 130 },
  { id: '28', name: 'HAWKINS WATER WORKS', type: 'UTILITY', price: 150, rent: [], position: 28, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 75 },
  { id: '29', name: 'HAWKINS GENERAL HOSPITAL', type: 'PROPERTY', price: 280, rent: [24, 120, 360, 850, 1025, 1200, 2200], shedCost: 150, labCost: 150, color: '#FFFF00', group: 'YELLOW', position: 29, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 140 },
  { id: '30', name: 'GO TO THE VOID', type: 'GO_TO_JAIL', price: 0, rent: [], position: 30, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '31', name: 'THE WOODS', type: 'PROPERTY', price: 300, rent: [26, 130, 390, 900, 1100, 1275, 2275], shedCost: 200, labCost: 200, color: '#008000', group: 'GREEN', position: 31, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 150 },
  { id: '32', name: 'CASTLE BYERS', type: 'PROPERTY', price: 300, rent: [26, 130, 390, 900, 1100, 1275, 2275], shedCost: 200, labCost: 200, color: '#008000', group: 'GREEN', position: 32, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 150 },
  { id: '33', name: 'CEREBRO', type: 'COMMUNITY_CHEST', price: 0, rent: [], position: 33, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '34', name: 'THE PUMPKIN PATCH', type: 'PROPERTY', price: 320, rent: [28, 150, 450, 1000, 1200, 1400, 2400], shedCost: 200, labCost: 200, color: '#008000', group: 'GREEN', position: 34, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 160 },
  { id: '35', name: 'STARCOURT STATION', type: 'RAILROAD', price: 200, rent: [25, 50, 100, 200], position: 35, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 100 },
  { id: '36', name: 'HELLFIRE CLUB', type: 'CHANCE', price: 0, rent: [], position: 36, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '37', name: 'HAWKINS NATIONAL LABORATORY', type: 'PROPERTY', price: 350, rent: [35, 175, 500, 1100, 1300, 1500, 2500], shedCost: 200, labCost: 200, color: '#0000FF', group: 'DARKBLUE', position: 37, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 175 },
  { id: '38', name: 'THE VOID TAX', type: 'TAX', price: 100, rent: [], position: 38, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 0 },
  { id: '39', name: 'HELLFIRE CLUB', type: 'PROPERTY', price: 400, rent: [50, 200, 600, 1400, 1700, 2000, 3000], shedCost: 200, labCost: 200, color: '#0000FF', group: 'DARKBLUE', position: 39, ownerId: null, sheds: 0, isMortgaged: false, mortgageValue: 200 },
];

export const ITEMS: Item[] = [
  { id: '1', name: 'Walkie Talkie', type: 'Communication', description: 'Allows you to reroll one die per turn.', image: 'https://picsum.photos/seed/walkie/200', status: 'Ready' },
  { id: '2', name: 'Slingshot', type: 'Defense', description: 'Protects you from one hazard event.', image: 'https://picsum.photos/seed/slingshot/200', status: 'Ready' },
  { id: '3', name: 'Flashlight', type: 'Exploration', description: 'Reveals the next Chance card.', image: 'https://picsum.photos/seed/flashlight/200', status: 'Ready' },
];

export const LOG_ENTRIES: LogEntry[] = [
  { id: '1', timestamp: '14:20:05', message: 'Subject Eleven has entered the board.', type: 'info' },
  { id: '2', timestamp: '14:21:12', message: 'Hazard detected: Demogorgon sighting near Mirkwood.', type: 'alert' },
  { id: '3', timestamp: '14:22:30', message: 'Transmission received: "Friends don\'t lie."', type: 'action' },
];
