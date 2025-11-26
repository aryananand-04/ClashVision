// lib/clash-royale/api.ts

import axios from 'axios';

const ROYALE_API_BASE = 'https://royaleapi.com/api';
const CLASH_API_BASE = 'https://api.clashroyale.com/v1';

// Official Clash Royale API key (you need to get this from https://developer.clashroyale.com)
const CLASH_API_KEY = process.env.CLASH_ROYALE_API_KEY;

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

export interface TopDeck {
  cards: number[];
  cardNames: string[];
  popularity: number;
  winRate: number;
  usage: number;
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

// Get all cards from Clash Royale API
export async function getAllCards(): Promise<CardData[]> {
  try {
    const response = await axios.get(`${CLASH_API_BASE}/cards`, {
      headers: {
        'Authorization': `Bearer ${CLASH_API_KEY}`,
      },
    });
    return response.data.items;
  } catch (error) {
    console.error('Error fetching cards:', error);
    // Fallback to RoyaleAPI if official API fails
    return getAllCardsFromRoyaleAPI();
  }
}

// Fallback: Get cards from RoyaleAPI (no auth required)
async function getAllCardsFromRoyaleAPI(): Promise<CardData[]> {
  try {
    const response = await axios.get('https://api.royaleapi.com/cards');
    return response.data;
  } catch (error) {
    console.error('Error fetching from RoyaleAPI:', error);
    return [];
  }
}

// Get player profile and current deck
export async function getPlayerProfile(playerTag: string): Promise<PlayerStats | null> {
  try {
    // Remove # from tag if present
    const cleanTag = playerTag.replace('#', '');
    
    const response = await axios.get(`${CLASH_API_BASE}/players/%23${cleanTag}`, {
      headers: {
        'Authorization': `Bearer ${CLASH_API_KEY}`,
      },
    });

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
      cards: data.cards,
    };
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
}

// Get top decks from RoyaleAPI
export async function getTopDecks(limit: number = 20): Promise<TopDeck[]> {
  try {
    const response = await axios.get(`${ROYALE_API_BASE}/decks/popular`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top decks:', error);
    return [];
  }
}

// Get meta decks by trophy range
export async function getMetaDecksByTrophyRange(minTrophies: number = 6000): Promise<any[]> {
  try {
    const response = await axios.get(`${ROYALE_API_BASE}/decks/meta`, {
      params: { 
        min_trophies: minTrophies,
        time_mode: '7d' // Last 7 days
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching meta decks:', error);
    return [];
  }
}

// Search for decks containing specific cards
export async function searchDecksByCards(cardIds: number[]): Promise<any[]> {
  try {
    const cardParams = cardIds.join(',');
    const response = await axios.get(`${ROYALE_API_BASE}/decks/search`, {
      params: { cards: cardParams },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching decks:', error);
    return [];
  }
}

// Get card stats and usage rates
export async function getCardStats(): Promise<any[]> {
  try {
    const response = await axios.get(`${ROYALE_API_BASE}/cards/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching card stats:', error);
    return [];
  }
}

// Get current challenges
export async function getCurrentChallenges(): Promise<any[]> {
  try {
    const response = await axios.get(`${CLASH_API_BASE}/challenges`, {
      headers: {
        'Authorization': `Bearer ${CLASH_API_KEY}`,
      },
    });
    return response.data.items;
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }
}

// Get global tournament info
export async function getGlobalTournaments(): Promise<any[]> {
  try {
    const response = await axios.get(`${CLASH_API_BASE}/globaltournaments`, {
      headers: {
        'Authorization': `Bearer ${CLASH_API_KEY}`,
      },
    });
    return response.data.items;
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
}

// Calculate deck statistics
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

  cards.forEach(card => {
    // Basic categorization based on card names
    const name = card.name.toLowerCase();
    
    if (name.includes('tower') || name.includes('building') || name === 'elixir collector') {
      composition.buildings++;
    } else if (
      name.includes('ball') || 
      name.includes('arrow') || 
      name.includes('zap') ||
      name.includes('rocket') ||
      name.includes('lightning') ||
      name === 'the log' ||
      name === 'rage' ||
      name === 'freeze'
    ) {
      composition.spells++;
    } else {
      composition.troops++;
    }

    // Win conditions
    if (
      name.includes('giant') ||
      name.includes('golem') ||
      name.includes('hog') ||
      name.includes('balloon') ||
      name.includes('x-bow') ||
      name.includes('mortar') ||
      name.includes('graveyard') ||
      name === 'royal giant' ||
      name === 'three musketeers'
    ) {
      composition.winConditions++;
    }
  });

  composition.supports = composition.troops - composition.winConditions;

  return composition;
}

// Deck archetype detection
export function detectDeckArchetype(cards: DeckCard[]): string {
  const cardNames = cards.map(c => c.name.toLowerCase());
  
  // Beatdown
  if (cardNames.some(n => n.includes('golem') || n.includes('lava hound') || n === 'giant')) {
    return 'Beatdown';
  }
  
  // Siege
  if (cardNames.some(n => n.includes('x-bow') || n.includes('mortar'))) {
    return 'Siege';
  }
  
  // Cycle
  if (cards.filter(c => c.elixir <= 2).length >= 4) {
    return 'Cycle';
  }
  
  // Bridge Spam
  if (cardNames.some(n => n.includes('battle ram') || n.includes('bandit') || n.includes('ram rider'))) {
    return 'Bridge Spam';
  }
  
  // Bait
  if (cardNames.filter(n => n.includes('goblin') || n.includes('skeleton')).length >= 3) {
    return 'Bait';
  }
  
  // Control
  if (cards.filter(c => c.elixir >= 4).length >= 5) {
    return 'Control';
  }
  
  return 'Midrange';
}

// Get card synergies
export function getCardSynergies(cardId: number): number[] {
  // This would ideally come from an API or database
  // For now, return common synergy pairs
  const synergies: Record<number, number[]> = {
    // Example: Hog Rider synergies
    26000016: [26000017, 26000000, 28000000], // Hog + Fireball/Zap/Log
    // Add more as needed
  };
  
  return synergies[cardId] || [];
}

// Get deck counters
export function getDeckCounters(cards: DeckCard[]): string[] {
  const counters: string[] = [];
  const composition = analyzeDeckComposition(cards);
  
  if (composition.buildings === 0) {
    counters.push('Vulnerable to Graveyard');
  }
  
  if (composition.spells < 2) {
    counters.push('Weak against swarm cards');
  }
  
  if (cards.every(c => c.elixir >= 3)) {
    counters.push('Vulnerable to cycle decks');
  }
  
  if (!cards.some(c => c.name.toLowerCase().includes('tank'))) {
    counters.push('No tank - vulnerable to heavy pushes');
  }
  
  return counters;
}