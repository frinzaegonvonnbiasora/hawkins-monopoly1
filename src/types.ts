export type Screen = 'BOARD' | 'PROPERTIES' | 'INVENTORY' | 'VOID';

export type TileType = 'PROPERTY' | 'RAILROAD' | 'UTILITY' | 'GO' | 'JAIL' | 'FREE_PARKING' | 'GO_TO_JAIL' | 'CHANCE' | 'COMMUNITY_CHEST' | 'TAX' | 'UPSIDE_DOWN';

export interface Property {
  id: string;
  name: string;
  type: TileType;
  price: number;
  rent: number[]; // [base, 1 shed, 2 sheds, 3 sheds, 4 sheds, lab, skyscraper]
  shedCost?: number;
  labCost?: number;
  color?: string;
  group?: string;
  position: number;
  ownerId: string | null;
  sheds: number; // 5 = lab
  isMortgaged: boolean;
  mortgageValue: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  position: number;
  money: number;
  inventory: Item[];
  isBankrupt: boolean;
  inJail: boolean;
  jailTurns: number;
  doublesCount: number;
}

export interface Item {
  id: string;
  name: string;
  type: string;
  description: string;
  image: string;
  status: 'Ready' | 'Inactive';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'action' | 'event' | 'alert';
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  properties: Property[];
  logs: LogEntry[];
  dice: [number, number];
  isRolling: boolean;
  isSettling: boolean;
  isRerolling: boolean;
  isGameOver: boolean;
  winner: Player | null;
  turnPhase: 'ROLL' | 'ACTION' | 'END';
  showingTitleDeed: Property | null;
  rerollsAvailable: number;
  turnStartPosition: number;
  pendingRent: { amount: number; ownerId: string; propertyName: string } | null;
}
