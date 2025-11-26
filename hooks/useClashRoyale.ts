import { useState, useEffect } from 'react';
import axios from 'axios';

export interface Card {
  id: number;
  name: string;
  maxLevel: number;
  iconUrls: {
    medium: string;
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

export interface DeckAnalysis {
  composition: {
    troops: number;
    spells: number;
    buildings: number;
    winConditions: number;
    supports: number;
    avgElixir: number;
  };
  archetype: string;
  counters: string[];
  avgElixir: number;
}

export function useClashRoyale() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all cards
  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/clash-royale/cards');
      return response.data.cards;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch cards');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch player profile
  const fetchPlayer = async (playerTag: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/clash-royale/player?tag=${encodeURIComponent(playerTag)}`);
      return response.data.player;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch player');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch top decks
  const fetchTopDecks = async (limit: number = 20) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/clash-royale/decks/top?limit=${limit}`);
      return response.data.decks;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch top decks');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch meta decks
  const fetchMetaDecks = async (minTrophies: number = 6000) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/clash-royale/decks/meta?minTrophies=${minTrophies}`);
      return response.data.decks;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch meta decks');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Search decks by cards
  const searchDecks = async (cardIds: number[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/clash-royale/decks/search?cards=${cardIds.join(',')}`);
      return response.data.decks;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search decks');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Analyze deck composition
  const analyzeDeck = async (cards: DeckCard[]): Promise<DeckAnalysis | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/clash-royale/analyze-deck', { cards });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze deck');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch card statistics
  const fetchCardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/clash-royale/cards/stats');
      return response.data.stats;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch card stats');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch current challenges
  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/clash-royale/challenges');
      return response.data.challenges;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch challenges');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch global tournaments
  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/clash-royale/tournaments');
      return response.data.tournaments;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tournaments');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchCards,
    fetchPlayer,
    fetchTopDecks,
    fetchMetaDecks,
    searchDecks,
    analyzeDeck,
    fetchCardStats,
    fetchChallenges,
    fetchTournaments,
  };
}

// Hook for cards with caching
export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCards = async () => {
      try {
        // Check if cards are cached
        const cached = sessionStorage.getItem('clash_royale_cards');
        if (cached) {
          setCards(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/clash-royale/cards');
        setCards(response.data.cards);
        
        // Cache cards for session
        sessionStorage.setItem('clash_royale_cards', JSON.stringify(response.data.cards));
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load cards');
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  return { cards, loading, error };
}

// Hook for player search
export function usePlayerSearch() {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlayer = async (playerTag: string) => {
    setLoading(true);
    setError(null);
    setPlayer(null);

    try {
      const response = await axios.get(`/api/clash-royale/player?tag=${encodeURIComponent(playerTag)}`);
      setPlayer(response.data.player);
      return response.data.player;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Player not found');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { player, loading, error, searchPlayer };
}