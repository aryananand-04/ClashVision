// lib/clash-royale/api.ts
import axios from 'axios';

const CLASH_API_BASE = 'https://api.clashroyale.com/v1';
const CLASH_API_KEY = process.env.CLASH_ROYALE_API_KEY;

// Axios instance with default config
const clashAPI = axios.create({
  baseURL: CLASH_API_BASE,
  headers: {
    'Authorization': `Bearer ${CLASH_API_KEY}`,
    'Accept': 'application/json',
  },
  timeout: 10000,
});

export interface CardData {
  id: number;
  name: string;
  maxLevel: number;
  iconUrls: {
    medium: string;
    evolutionMedium?: string;
  };
  rarity?: string;
  elixirCost?: number;
}

export interface DeckCard {
  id: number;
  name: string;
  level: number;
  maxLevel: number;
  iconUrl: string;
  elixir: number;
  rarity: string;
}

export interface PlayerDeck {
  cards: DeckCard[];
  averageElixir: number;
}

export interface PlayerStats {
  tag: string;
  name: string;
  trophies: number;
  bestTrophies: number;
  wins: number;
  losses: number;
  currentDeck: PlayerDeck;
  cards: CardData[];
}

// ===== CORE API FUNCTIONS =====

/**
 * Get all cards from Official Clash Royale API
 */
export async function getAllCards(): Promise<CardData[]> {
  try {
    if (!CLASH_API_KEY) {
      throw new Error('CLASH_ROYALE_API_KEY is not set in environment variables');
    }

    const response = await clashAPI.get('/cards');
    return response.data.items || [];
  } catch (error: any) {
    console.error('Error fetching cards:', error.response?.data || error.message);
    throw new Error('Failed to fetch cards from Clash Royale API');
  }
}

/**
 * Get player profile and current deck
 * @param playerTag - Player tag (with or without #)
 */
export async function getPlayerProfile(playerTag: string): Promise<PlayerStats | null> {
  try {
    if (!CLASH_API_KEY) {
      throw new Error('CLASH_ROYALE_API_KEY is not set');
    }

    // Clean and encode player tag
    const cleanTag = playerTag.replace('#', '').toUpperCase();
    const encodedTag = encodeURIComponent(`#${cleanTag}`);

    const response = await clashAPI.get(`/players/${encodedTag}`);
    const data = response.data;

    return {
      tag: data.tag,
      name: data.name,
      trophies: data.trophies,
      bestTrophies: data.bestTrophies,
      wins: data.wins,
      losses: data.losses,
      currentDeck: {
        cards: data.currentDeck.map((card: any) => ({
          id: card.id,
          name: card.name,
          level: card.level,
          maxLevel: card.maxLevel,
          iconUrl: card.iconUrls.medium,
          elixir: card.elixirCost || 0,
          rarity: card.rarity || 'common',
        })),
        averageElixir: calculateAverageElixir(data.currentDeck),
      },
      cards: data.cards || [],
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('Player not found:', playerTag);
      return null;
    }
    console.error('Error fetching player profile:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Get current challenges
 */
export async function getCurrentChallenges(): Promise<any[]> {
  try {
    if (!CLASH_API_KEY) {
      throw new Error('CLASH_ROYALE_API_KEY is not set');
    }

    const response = await clashAPI.get('/challenges');
    return response.data.items || [];
  } catch (error: any) {
    console.error('Error fetching challenges:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Get global tournaments
 */
export async function getGlobalTournaments(): Promise<any[]> {
  try {
    if (!CLASH_API_KEY) {
      throw new Error('CLASH_ROYALE_API_KEY is not set');
    }

    const response = await clashAPI.get('/globaltournaments');
    return response.data.items || [];
  } catch (error: any) {
    console.error('Error fetching tournaments:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Get locations (regions)
 */
export async function getLocations(): Promise<any[]> {
  try {
    if (!CLASH_API_KEY) {
      throw new Error('CLASH_ROYALE_API_KEY is not set');
    }

    const response = await clashAPI.get('/locations');
    return response.data.items || [];
  } catch (error: any) {
    console.error('Error fetching locations:', error.response?.data || error.message);
    return [];
  }
}

// ===== MOCK/SIMULATED FUNCTIONS =====
// These replace the discontinued RoyaleAPI endpoints

/**
 * Simulate top decks (Mock data - would need real implementation)
 * Note: Official API doesn't provide this directly
 */
export async function getTopDecks(limit: number = 20): Promise<any[]> {
  console.warn('getTopDecks: This endpoint no longer exists. Returning mock data.');
  
  // In production, you would:
  // 1. Scrape RoyaleAPI.com website (against ToS)
  // 2. Build your own tracking system
  // 3. Use alternative APIs like StatsRoyale (requires partnership)
  
  return [];
}

/**
 * Simulate meta decks by trophy range (Mock data)
 */
export async function getMetaDecksByTrophyRange(minTrophies: number = 6000): Promise<any[]> {
  console.warn('getMetaDecksByTrophyRange: RoyaleAPI discontinued. No alternative available.');
  return [];
}

/**
 * Simulate deck search (Mock data)
 */
export async function searchDecksByCards(cardIds: number[]): Promise<any[]> {
  console.warn('searchDecksByCards: RoyaleAPI discontinued. No alternative available.');
  return [];
}

/**
 * Simulate card statistics (Mock data)
 */
export async function getCardStats(): Promise<any[]> {
  console.warn('getCardStats: RoyaleAPI discontinued. No alternative available.');
  return [];
}

// ===== UTILITY FUNCTIONS =====

export function calculateAverageElixir(cards: any[]): number {
  if (!cards || cards.length === 0) return 0;
  const total = cards.reduce((sum, card) => sum + (card.elixirCost || 0), 0);
  return Math.round((total / cards.length) * 10) / 10;
}

export function analyzeDeckComposition(cards: DeckCard[]) {
  const composition = {
    troops: 0,
    spells: 0,
    buildings: 0,
    winConditions: 0,
    supports: 0,
    avgElixir: calculateAverageElixir(cards),
  };

  const spellKeywords = ['ball', 'arrow', 'zap', 'rocket', 'lightning', 'log', 'rage', 'freeze', 'poison', 'tornado', 'graveyard'];
  const buildingKeywords = ['tower', 'cannon', 'tesla', 'inferno', 'mortar', 'x-bow', 'collector', 'tombstone', 'furnace', 'goblin hut', 'barbarian hut'];
  const winConditionKeywords = ['giant', 'golem', 'hog', 'balloon', 'x-bow', 'mortar', 'graveyard', 'royal giant', 'three musketeers', 'goblin barrel', 'miner', 'sparky'];

  cards.forEach(card => {
    const name = card.name.toLowerCase();
    
    if (buildingKeywords.some(keyword => name.includes(keyword))) {
      composition.buildings++;
    } else if (spellKeywords.some(keyword => name.includes(keyword))) {
      composition.spells++;
    } else {
      composition.troops++;
    }

    if (winConditionKeywords.some(keyword => name.includes(keyword))) {
      composition.winConditions++;
    }
  });

  composition.supports = composition.troops - composition.winConditions;
  return composition;
}

export function detectDeckArchetype(cards: DeckCard[]): string {
  const cardNames = cards.map(c => c.name.toLowerCase());
  const avgElixir = calculateAverageElixir(cards);
  
  if (cardNames.some(n => n.includes('golem') || n.includes('lava hound') || n === 'giant')) {
    return 'Beatdown';
  }
  
  if (cardNames.some(n => n.includes('x-bow') || n.includes('mortar'))) {
    return 'Siege';
  }
  
  if (cards.filter(c => c.elixir <= 2).length >= 4) {
    return 'Cycle';
  }
  
  if (cardNames.some(n => n.includes('battle ram') || n.includes('bandit') || n.includes('ram rider'))) {
    return 'Bridge Spam';
  }
  
  if (cardNames.filter(n => n.includes('goblin') || n.includes('skeleton')).length >= 3) {
    return 'Bait';
  }
  
  if (avgElixir >= 4.0) {
    return 'Control';
  }
  
  return 'Midrange';
}

export function getDeckCounters(cards: DeckCard[]): string[] {
  const counters: string[] = [];
  const composition = analyzeDeckComposition(cards);
  
  if (composition.buildings === 0) {
    counters.push('Vulnerable to Graveyard and siege decks');
  }
  
  if (composition.spells < 2) {
    counters.push('Weak against swarm units');
  }
  
  if (cards.every(c => c.elixir >= 3)) {
    counters.push('Vulnerable to fast cycle decks');
  }
  
  if (!cards.some(c => c.name.toLowerCase().includes('tank'))) {
    counters.push('No tank - struggles against heavy beatdown');
  }

  if (composition.winConditions === 0) {
    counters.push('No clear win condition');
  }
  
  return counters;
}

// Export API client for advanced usage
export { clashAPI };