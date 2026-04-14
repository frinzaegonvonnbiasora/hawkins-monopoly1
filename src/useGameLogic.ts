import { useState, useCallback, useEffect } from 'react';
import { GameState, Player, Property, LogEntry, TileType } from './types';
import { INITIAL_PROPERTIES, BOARD_SIZE, ITEMS } from './constants';

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'ELEVEN',
    color: '#E11322',
    position: 0,
    money: 1500,
    inventory: [ITEMS[0]],
    isBankrupt: false,
    inJail: false,
    jailTurns: 0,
    doublesCount: 0,
  },
  {
    id: 'p2',
    name: 'DUSTIN',
    color: '#F27D26',
    position: 0,
    money: 1500,
    inventory: [ITEMS[1]],
    isBankrupt: false,
    inJail: false,
    jailTurns: 0,
    doublesCount: 0,
  },
];

// ─── Helper: resolve non-interactive tiles immediately after landing ───────────
// Returns the new phase and any state mutations needed.
// Returns 'ACTION' for tiles that need a UI decision (buy/pay rent).
// Returns 'END' for tiles that resolve instantly (jail, tax, free parking, etc.)
function resolveTileImmediately(
  tile: Property,
  player: Player,
  players: Player[],
  properties: Property[],
  dice: [number, number],
  addLog: (msg: string, type?: LogEntry['type']) => void
): {
  phase: 'ACTION' | 'END';
  playerOverride?: Partial<Player>;
  pendingRent?: { amount: number; ownerId: string; propertyName: string } | null;
} {
  switch (tile.type) {
    // ── GO TO JAIL ── auto-resolve, no action needed
    case 'GO_TO_JAIL': {
      addLog(`${player.name} landed on GO TO THE VOID and is sent to jail!`, 'alert');
      return {
        phase: 'END',
        playerOverride: { position: 10, inJail: true, doublesCount: 0 },
      };
    }

    // ── TAX ── deduct instantly
    case 'TAX': {
      addLog(`${player.name} paid $${tile.price} in ${tile.name}.`, 'alert');
      return {
        phase: 'END',
        playerOverride: { money: player.money - tile.price },
      };
    }

    // ── FREE PARKING / JAIL (visiting) / GO ── nothing to do, just log
    case 'FREE_PARKING': {
      addLog(`${player.name} landed on Free Parking. Safe zone — nothing happens.`, 'info');
      return { phase: 'END' };
    }
    case 'JAIL': {
      addLog(`${player.name} is just visiting the Void. No penalty.`, 'info');
      return { phase: 'END' };
    }
    case 'GO': {
      // $200 is already awarded in rollDice before this is called
      return { phase: 'END' };
    }

    // ── CHANCE / COMMUNITY CHEST ── draw card, resolve immediately
    case 'CHANCE':
    case 'COMMUNITY_CHEST': {
      const isChance = tile.type === 'CHANCE';
      
      // Use the same themed cards as the server
      const events = isChance 
        ? [
            { text: "Caught in the Vines: Go directly to THE VOID. Do not pass GO.", action: (p: Player) => { p.inJail = true; p.position = 10; } },
            { text: "Gateway Opened: Advance to the nearest 'Cerebro' space.", action: (p: Player) => {
                const cerebroIndices = [2, 17, 33];
                const next = cerebroIndices.find(idx => idx > p.position) || cerebroIndices[0];
                if (next < p.position) p.money += 200;
                p.position = next;
            }},
            { text: "Vecna's Curse: Grandfather clock chimes. Pay $50 for every shed and $200 for every lab.", action: (p: Player) => {
                // Simplified for client-side without full property iteration helper
                p.money -= 100; // Placeholder penalty
            }},
            { text: "Demobat Attack: Swarm descends. Pay $15 fine.", action: (p: Player) => { p.money -= 15; } },
            { text: "Hitch a Ride with Argyle: Advance to Hawkins Lab. Collect $200 if you pass GO.", action: (p: Player) => {
                const target = 37;
                if (target < p.position) p.money += 200;
                p.position = target;
            }},
            { text: "Fireball!: Natural 20 in Hellfire Club. Collect $150.", action: (p: Player) => { p.money += 150; } },
            { text: "Nina Project: Recovering memories. Advance to GO (Collect $200).", action: (p: Player) => { p.position = 0; p.money += 200; } },
            { text: "Stolen Eggos: Eleven got hungry. Pay $50.", action: (p: Player) => { p.money -= 50; } },
          ]
        : [
            { text: "Radio Check: Dustin gets the signal through. Collect $100.", action: (p: Player) => { p.money += 100; } },
            { text: "Family Video Payday: Steve and Robin busy Friday. Collect $20.", action: (s: Player) => { s.money += 20; } },
            { text: "Scoops Ahoy Tips: USS Butterscotch a hit. Collect $10.", action: (p: Player) => { p.money += 10; } },
            { text: "Grandmother’s Inheritance: Fortunes from Mrs. Wheeler. Collect $100.", action: (p: Player) => { p.money += 100; } },
            { text: "D&D Campaign Win: Defeated the Lich. Collect $25.", action: (p: Player) => { p.money += 25; } },
            { text: "Hospital Fees: Hit from a Demogorgon. Pay $100.", action: (p: Player) => { p.money -= 100; } },
            { text: "Bake Sale for Barb: Community support. Collect $200.", action: (p: Player) => { p.money += 200; } },
            { text: "Life Insurance: Hopper's care. Collect $100.", action: (p: Player) => { p.money += 100; } },
            { text: "Fixing the Cabin: Maintenance expensive. Pay $50.", action: (p: Player) => { p.money -= 50; } },
          ];

      const event = events[Math.floor(Math.random() * events.length)];
      const clone = { ...player };
      const oldPos = clone.position;
      event.action(clone);
      const movedMsg = clone.position !== oldPos
        ? ` Moved to ${properties[clone.position]?.name ?? clone.position}.`
        : '';
      
      addLog(
        `${isChance ? 'Hellfire Club' : 'Cerebro'}: ${event.text}${movedMsg}`,
        'action'
      );

      return {
        phase: 'END',
        playerOverride: {
          position: clone.position,
          money: clone.money,
          inJail: clone.inJail,
        },
      };
    }

    // ── PROPERTY / RAILROAD / UTILITY ── needs ACTION panel
    case 'PROPERTY':
    case 'RAILROAD':
    case 'UTILITY': {
      // Owned by someone else → calculate pending rent
      if (tile.ownerId !== null && tile.ownerId !== player.id) {
        const owner = players.find(p => p.id === tile.ownerId);
        if (owner) {
          let rent = 0;
          if (tile.type === 'PROPERTY') {
            rent = tile.rent[tile.sheds] ?? 0;
          } else if (tile.type === 'RAILROAD') {
            const count = properties.filter(
              p => p.type === 'RAILROAD' && p.ownerId === owner.id
            ).length;
            rent = 25 * Math.pow(2, count - 1);
          } else if (tile.type === 'UTILITY') {
            const count = properties.filter(
              p => p.type === 'UTILITY' && p.ownerId === owner.id
            ).length;
            rent = (dice[0] + dice[1]) * (count === 1 ? 4 : 10);
          }
          return {
            phase: 'ACTION',
            pendingRent: { amount: rent, ownerId: owner.id, propertyName: tile.name },
          };
        }
      }
      // Unowned or own property → show ACTION panel (buy / pass / own)
      return { phase: 'ACTION' };
    }

    default:
      return { phase: 'END' };
  }
}

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: INITIAL_PLAYERS,
    currentPlayerIndex: 0,
    properties: INITIAL_PROPERTIES,
    logs: [],
    dice: [1, 1],
    isRolling: false,
    isSettling: false,
    isRerolling: false,
    isGameOver: false,
    winner: null,
    turnPhase: 'ROLL',
    showingTitleDeed: null,
    rerollsAvailable: 2,
    turnStartPosition: 0,
    pendingRent: null,
  });

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      message,
      type,
    };
    setGameState(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs].slice(0, 50),
    }));
  }, []);

  // ─── ROLL DICE ────────────────────────────────────────────────────────────
  const rollDice = useCallback(() => {
    if (gameState.turnPhase !== 'ROLL' || gameState.isRolling) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.inJail) return; // jail has its own handler

    setGameState(prev => ({
      ...prev,
      isRolling: true,
      isRerolling: false,
      turnStartPosition: currentPlayer.position,
      rerollsAvailable: 2,
    }));

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;
      const isDoubles = d1 === d2;

      setGameState(prev => ({
        ...prev,
        dice: [d1, d2],
        isRolling: false,
        isSettling: true,
      }));

      setTimeout(() => {
        setGameState(prev => {
          const player = prev.players[prev.currentPlayerIndex];
          let newDoublesCount = isDoubles ? player.doublesCount + 1 : 0;

          // 3 doubles in a row → straight to jail
          if (newDoublesCount === 3) {
            const updatedPlayers = [...prev.players];
            updatedPlayers[prev.currentPlayerIndex] = {
              ...player,
              inJail: true,
              position: 10,
              doublesCount: 0,
            };
            addLog(`${player.name} rolled 3 doubles and is sent to THE VOID!`, 'alert');
            return {
              ...prev,
              players: updatedPlayers,
              dice: [d1, d2],
              isRolling: false,
              isSettling: false,
              turnPhase: 'END',
            };
          }

          let newPosition = (player.position + total) % BOARD_SIZE;
          let newMoney = player.money;

          // Passed GO or landed exactly on GO — both award $200
          // newPosition < player.position means we wrapped around the board
          // newPosition === 0 means we landed exactly on GO
          const passedOrLandedOnGo = newPosition < player.position || newPosition === 0;
          if (passedOrLandedOnGo) {
            newMoney += 200;
            if (newPosition === 0) {
              addLog(`${player.name} landed on GO and collected $200!`, 'action');
            } else {
              addLog(`${player.name} passed GO and collected $200.`, 'action');
            }
          }

          // Log the roll THEN the landing (correct order)
          const targetTile = prev.properties[newPosition];
          const groupInfo = targetTile.group ? ` (${targetTile.group})` : '';
          addLog(
            `${player.name} rolled ${total} (${d1}+${d2}) and landed on ${targetTile.name}${groupInfo}.`
          );
          if (isDoubles) {
            addLog(`${player.name} rolled doubles! They get another turn after resolving this space.`, 'action');
          }

          // Build updated player before tile resolution
          const updatedPlayerBase: Player = {
            ...player,
            position: newPosition,
            money: newMoney,
            doublesCount: newDoublesCount,
          };

          // ── AUTO-RESOLVE non-interactive tiles ──────────────────────────
          const resolution = resolveTileImmediately(
            targetTile,
            updatedPlayerBase,
            prev.players,
            prev.properties,
            [d1, d2],
            addLog
          );

          const finalPlayer: Player = {
            ...updatedPlayerBase,
            ...(resolution.playerOverride ?? {}),
          };

          const updatedPlayers = [...prev.players];
          updatedPlayers[prev.currentPlayerIndex] = finalPlayer;

          return {
            ...prev,
            players: updatedPlayers,
            dice: [d1, d2],
            isRolling: false,
            isSettling: false,
            turnPhase: resolution.phase,
            pendingRent: resolution.pendingRent ?? prev.pendingRent,
          };
        });
      }, 600);
    }, 800);
  }, [
    gameState.turnPhase,
    gameState.isRolling,
    gameState.currentPlayerIndex,
    gameState.players,
    gameState.properties,
    addLog,
  ]);

  // ─── REROLL DICE ──────────────────────────────────────────────────────────
  const rerollDice = useCallback(() => {
    if (
      gameState.turnPhase !== 'ACTION' ||
      gameState.isRolling ||
      gameState.rerollsAvailable <= 0
    )
      return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    setGameState(prev => ({
      ...prev,
      isRolling: true,
      isRerolling: true,
      rerollsAvailable: prev.rerollsAvailable - 1,
    }));

    addLog(
      `${currentPlayer.name} used a reroll! (${gameState.rerollsAvailable - 1} left)`,
      'action'
    );

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;
      const isDoubles = d1 === d2;

      setGameState(prev => ({
        ...prev,
        dice: [d1, d2],
        isRolling: false,
        isSettling: true,
      }));

      setTimeout(() => {
        setGameState(prev => {
          const player = prev.players[prev.currentPlayerIndex];
          const newDoublesCount = isDoubles ? player.doublesCount + 1 : 0;

          let newPosition = (prev.turnStartPosition + total) % BOARD_SIZE;
          let newMoney = player.money;

          const passedOrLandedOnGo = newPosition < prev.turnStartPosition || newPosition === 0;
          if (passedOrLandedOnGo) {
            newMoney += 200;
            if (newPosition === 0) {
              addLog(`${player.name} landed on GO and collected $200!`, 'action');
            } else {
              addLog(`${player.name} passed GO and collected $200.`, 'action');
            }
          }

          const targetTile = prev.properties[newPosition];
          const groupInfo = targetTile.group ? ` (${targetTile.group})` : '';
          addLog(
            `${player.name} rerolled ${total} (${d1}+${d2}) and landed on ${targetTile.name}${groupInfo}.`
          );

          const updatedPlayerBase: Player = {
            ...player,
            position: newPosition,
            money: newMoney,
            doublesCount: newDoublesCount,
          };

          const resolution = resolveTileImmediately(
            targetTile,
            updatedPlayerBase,
            prev.players,
            prev.properties,
            [d1, d2],
            addLog
          );

          const finalPlayer: Player = {
            ...updatedPlayerBase,
            ...(resolution.playerOverride ?? {}),
          };

          const updatedPlayers = [...prev.players];
          updatedPlayers[prev.currentPlayerIndex] = finalPlayer;

          return {
            ...prev,
            players: updatedPlayers,
            isRolling: false,
            isSettling: false,
            turnPhase: resolution.phase,
            pendingRent: resolution.pendingRent ?? null,
          };
        });
      }, 600);
    }, 800);
  }, [
    gameState.turnPhase,
    gameState.isRolling,
    gameState.rerollsAvailable,
    gameState.currentPlayerIndex,
    gameState.players,
    gameState.properties,
    gameState.turnStartPosition,
    addLog,
  ]);

  // ─── HANDLE ACTION (called from UI "Resolve Action" button) ───────────────
  // Only used for property tiles in ACTION phase now — all other tiles
  // are resolved automatically inside resolveTileImmediately.
  const handleAction = useCallback(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const currentTile = gameState.properties[currentPlayer.position];

    // If there's a pending rent, force payment first
    if (gameState.pendingRent) return;

    // For owned-by-self or pass scenarios just end the turn
    setGameState(prev => ({ ...prev, turnPhase: 'END' }));
  }, [gameState]);

  // ─── BUY PROPERTY ────────────────────────────────────────────────────────
  const buyProperty = useCallback(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const currentTile = gameState.properties[currentPlayer.position];

    if (currentTile.ownerId === null && currentPlayer.money >= currentTile.price) {
      setGameState(prev => {
        const updatedPlayers = [...prev.players];
        updatedPlayers[prev.currentPlayerIndex] = {
          ...updatedPlayers[prev.currentPlayerIndex],
          money: updatedPlayers[prev.currentPlayerIndex].money - currentTile.price,
        };

        const updatedProperties = [...prev.properties];
        updatedProperties[currentPlayer.position] = {
          ...updatedProperties[currentPlayer.position],
          ownerId: currentPlayer.id,
        };

        addLog(
          `${currentPlayer.name} purchased ${currentTile.name} for $${currentTile.price}.`,
          'action'
        );

        return {
          ...prev,
          players: updatedPlayers,
          properties: updatedProperties,
          turnPhase: 'END',
          showingTitleDeed: updatedProperties[currentPlayer.position],
        };
      });
    }
  }, [gameState.players, gameState.currentPlayerIndex, gameState.properties, addLog]);

  // ─── PAY RENT ────────────────────────────────────────────────────────────
  const payRent = useCallback(() => {
    setGameState(prev => {
      if (!prev.pendingRent) return prev;

      const { amount, ownerId, propertyName } = prev.pendingRent;
      const currentPlayer = prev.players[prev.currentPlayerIndex];

      if (currentPlayer.money < amount) {
        addLog(`Not enough money to pay $${amount} rent!`, 'alert');
        return prev;
      }

      const updatedPlayers = [...prev.players];
      const ownerIdx = updatedPlayers.findIndex(p => p.id === ownerId);
      updatedPlayers[prev.currentPlayerIndex] = {
        ...updatedPlayers[prev.currentPlayerIndex],
        money: updatedPlayers[prev.currentPlayerIndex].money - amount,
      };
      updatedPlayers[ownerIdx] = {
        ...updatedPlayers[ownerIdx],
        money: updatedPlayers[ownerIdx].money + amount,
      };

      addLog(
        `${currentPlayer.name} paid $${amount} rent to ${updatedPlayers[ownerIdx].name} for ${propertyName}.`,
        'action'
      );

      return {
        ...prev,
        players: updatedPlayers,
        pendingRent: null,
        turnPhase: 'END',
      };
    });
  }, [addLog]);

  // ─── UPGRADE PROPERTY ────────────────────────────────────────────────────
  const upgradeProperty = useCallback(
    (propertyId: string) => {
      setGameState(prev => {
        const propertyIdx = prev.properties.findIndex(p => p.id === propertyId);
        if (propertyIdx === -1) return prev;

        const property = prev.properties[propertyIdx];
        const owner = prev.players.find(p => p.id === property.ownerId);

        if (!owner || property.sheds >= 6) return prev;

        let cost = 0;
        let upgradeName = '';

        if (property.sheds < 4) {
          cost = property.shedCost ?? 0;
          upgradeName = `Shed ${property.sheds + 1}`;
        } else if (property.sheds === 4) {
          cost = property.labCost ?? 0;
          upgradeName = 'Hawkins Lab';
        } else if (property.sheds === 5) {
          cost = property.labCost ?? 0;
          upgradeName = 'Skyscraper';
        }

        if (owner.money < cost) return prev;

        const updatedPlayers = [...prev.players];
        const ownerIdx = updatedPlayers.findIndex(p => p.id === owner.id);
        updatedPlayers[ownerIdx] = {
          ...updatedPlayers[ownerIdx],
          money: updatedPlayers[ownerIdx].money - cost,
        };

        const updatedProperties = [...prev.properties];
        updatedProperties[propertyIdx] = { ...property, sheds: property.sheds + 1 };

        addLog(`${owner.name} upgraded ${property.name} to ${upgradeName}.`, 'action');

        return { ...prev, players: updatedPlayers, properties: updatedProperties };
      });
    },
    [addLog]
  );

  // ─── MORTGAGE PROPERTY ───────────────────────────────────────────────────
  const mortgageProperty = useCallback(
    (propertyId: string) => {
      setGameState(prev => {
        const propertyIdx = prev.properties.findIndex(p => p.id === propertyId);
        if (propertyIdx === -1) return prev;

        const property = prev.properties[propertyIdx];
        const owner = prev.players.find(p => p.id === property.ownerId);

        if (!owner || property.sheds > 0) return prev;

        const updatedPlayers = [...prev.players];
        const ownerIdx = updatedPlayers.findIndex(p => p.id === owner.id);
        const updatedProperties = [...prev.properties];
        const isMortgaging = !property.isMortgaged;

        if (isMortgaging) {
          updatedPlayers[ownerIdx] = {
            ...updatedPlayers[ownerIdx],
            money: updatedPlayers[ownerIdx].money + property.mortgageValue,
          };
          addLog(`${owner.name} mortgaged ${property.name} for $${property.mortgageValue}.`, 'action');
        } else {
          const unmortgageCost = Math.ceil(property.mortgageValue * 1.1);
          if (owner.money < unmortgageCost) return prev;
          updatedPlayers[ownerIdx] = {
            ...updatedPlayers[ownerIdx],
            money: updatedPlayers[ownerIdx].money - unmortgageCost,
          };
          addLog(`${owner.name} unmortgaged ${property.name} for $${unmortgageCost}.`, 'action');
        }

        updatedProperties[propertyIdx] = { ...property, isMortgaged: isMortgaging };

        return { ...prev, players: updatedPlayers, properties: updatedProperties };
      });
    },
    [addLog]
  );

  // ─── JAIL ACTIONS ────────────────────────────────────────────────────────
  const handleJailAction = useCallback(
    (action: 'PAY' | 'ROLL' | 'CARD') => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        if (!currentPlayer.inJail) return prev;

        const updatedPlayers = [...prev.players];
        const player = { ...updatedPlayers[prev.currentPlayerIndex] };

        if (action === 'PAY') {
          if (player.money < 50) return prev;
          player.money -= 50;
          player.inJail = false;
          player.jailTurns = 0;
          updatedPlayers[prev.currentPlayerIndex] = player;
          addLog(`${player.name} paid $50 to leave the Void.`, 'action');
          return { ...prev, players: updatedPlayers, turnPhase: 'ROLL' };
        }

        if (action === 'ROLL') {
          // Kick off the async roll — we return prev immediately and let
          // the setTimeout chain call setGameState again.
          setGameState(inner => ({ ...inner, isRolling: true }));

          setTimeout(() => {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;

            setGameState(inner => ({
              ...inner,
              dice: [d1, d2],
              isRolling: false,
              isSettling: true,
            }));

            setTimeout(() => {
              setGameState(inner => {
                const p = { ...inner.players[inner.currentPlayerIndex] };
                addLog(`${p.name} rolled ${d1}, ${d2} while in the Void.`, 'info');

                const ups = [...inner.players];

                if (d1 === d2) {
                  p.inJail = false;
                  p.jailTurns = 0;
                  const newPos = (p.position + d1 + d2) % BOARD_SIZE;
                  p.position = newPos;
                  const targetTile = inner.properties[newPos];
                  addLog(
                    `${p.name} rolled doubles and escaped the Void! Landed on ${targetTile.name}.`,
                    'action'
                  );
                  ups[inner.currentPlayerIndex] = p;

                  const resolution = resolveTileImmediately(
                    targetTile,
                    p,
                    inner.players,
                    inner.properties,
                    [d1, d2],
                    addLog
                  );
                  const finalP = { ...p, ...(resolution.playerOverride ?? {}) };
                  ups[inner.currentPlayerIndex] = finalP;

                  return {
                    ...inner,
                    players: ups,
                    isRolling: false,
                    isSettling: false,
                    turnPhase: resolution.phase,
                    pendingRent: resolution.pendingRent ?? null,
                  };
                } else {
                  p.jailTurns += 1;
                  if (p.jailTurns >= 3) {
                    p.money -= 50;
                    p.inJail = false;
                    p.jailTurns = 0;
                    const newPos = (p.position + d1 + d2) % BOARD_SIZE;
                    p.position = newPos;
                    const targetTile = inner.properties[newPos];
                    addLog(
                      `${p.name} failed to roll doubles for 3 turns. Paid $50 and moved to ${targetTile.name}.`,
                      'action'
                    );
                    ups[inner.currentPlayerIndex] = p;

                    const resolution = resolveTileImmediately(
                      targetTile,
                      p,
                      inner.players,
                      inner.properties,
                      [d1, d2],
                      addLog
                    );
                    const finalP = { ...p, ...(resolution.playerOverride ?? {}) };
                    ups[inner.currentPlayerIndex] = finalP;

                    return {
                      ...inner,
                      players: ups,
                      isRolling: false,
                      isSettling: false,
                      turnPhase: resolution.phase,
                      pendingRent: resolution.pendingRent ?? null,
                    };
                  }
                  addLog(`${p.name} remains in the Void. (Turn ${p.jailTurns}/3)`, 'action');
                  ups[inner.currentPlayerIndex] = p;
                  return {
                    ...inner,
                    players: ups,
                    isRolling: false,
                    isSettling: false,
                    turnPhase: 'END',
                  };
                }
              });
            }, 600);
          }, 800);

          return prev; // async chain takes over
        }

        return prev;
      });
    },
    [addLog]
  );

  // ─── BANKRUPTCY CHECK ────────────────────────────────────────────────────
  const checkBankruptcy = useCallback(
    (playerIndex: number) => {
      setGameState(prev => {
        const player = prev.players[playerIndex];
        if (player.money >= 0 || player.isBankrupt) return prev;

        const playerProperties = prev.properties.filter(
          p => p.ownerId === player.id && !p.isMortgaged
        );
        if (playerProperties.length > 0) return prev; // still has assets

        const updatedPlayers = [...prev.players];
        updatedPlayers[playerIndex] = { ...player, isBankrupt: true, money: 0 };

        const updatedProperties = prev.properties.map(p =>
          p.ownerId === player.id
            ? { ...p, ownerId: null, sheds: 0, isMortgaged: false }
            : p
        );

        addLog(`${player.name} has gone bankrupt!`, 'alert');

        const activePlayers = updatedPlayers.filter(p => !p.isBankrupt);
        if (activePlayers.length === 1) {
          return {
            ...prev,
            players: updatedPlayers,
            properties: updatedProperties,
            isGameOver: true,
            winner: activePlayers[0],
          };
        }

        return { ...prev, players: updatedPlayers, properties: updatedProperties };
      });
    },
    [addLog]
  );

  // ─── TITLE DEED HELPERS ──────────────────────────────────────────────────
  const showTitleDeed = useCallback((propertyId: string) => {
    setGameState(prev => {
      const property = prev.properties.find(p => p.id === propertyId);
      if (!property) return prev;
      return { ...prev, showingTitleDeed: property };
    });
  }, []);

  const hideTitleDeed = useCallback(() => {
    setGameState(prev => ({ ...prev, showingTitleDeed: null }));
  }, []);

  // ─── END TURN ────────────────────────────────────────────────────────────
  const endTurn = useCallback(() => {
    setGameState(prev => {
      if (prev.pendingRent) {
        addLog('You must pay rent before ending your turn!', 'alert');
        return prev;
      }
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        turnPhase: 'ROLL',
        showingTitleDeed: null,
        isRerolling: false,
        pendingRent: null,
      };
    });
  }, [addLog]);

  // ─── BANKRUPTCY SIDE-EFFECT ──────────────────────────────────────────────
  useEffect(() => {
    checkBankruptcy(gameState.currentPlayerIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.players[gameState.currentPlayerIndex].money]);

  // ─── RESET GAME ──────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    setGameState({
      players: INITIAL_PLAYERS,
      currentPlayerIndex: 0,
      properties: INITIAL_PROPERTIES,
      logs: [],
      dice: [1, 1],
      isRolling: false,
      isSettling: false,
      isRerolling: false,
      isGameOver: false,
      winner: null,
      turnPhase: 'ROLL',
      showingTitleDeed: null,
      rerollsAvailable: 2,
      turnStartPosition: 0,
      pendingRent: null,
    });
    addLog('Transmission reset. Starting new session.', 'info');
  }, [addLog]);

  return {
    gameState,
    setGameState,
    resetGame,
    rollDice,
    rerollDice,
    handleAction,
    buyProperty,
    upgradeProperty,
    mortgageProperty,
    handleJailAction,
    payRent,
    showTitleDeed,
    endTurn,
    hideTitleDeed,
  };
};