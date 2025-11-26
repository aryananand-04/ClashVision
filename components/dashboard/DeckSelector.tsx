'use client';
import React, { useState, useEffect } from 'react';
import { Search, X, Swords, Loader2, Play, Check, Sparkles } from 'lucide-react';

// Types
interface Card {
  id: number;
  name: string;
  iconUrls: { 
    medium: string;
    evolutionMedium?: string;
  };
  elixirCost?: number;
  rarity?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
}

export default function DeckSelector() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [view, setView] = useState<'selector' | 'results'>('selector');
  const [error, setError] = useState('');
  const [showEvolutions, setShowEvolutions] = useState(false);
  const [fetchingTranscripts, setFetchingTranscripts] = useState(false);

  // Load cards on mount
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch('/api/clash-royale/cards');
      const data = await response.json();
      
      // Store both regular and evolution cards
      const regularCards = data.cards || [];
      
      // Create evolution versions for cards that have evolutionMedium icon
      const evolutionCards = regularCards
        .filter((card: Card) => card.iconUrls.evolutionMedium)
        .map((card: Card) => ({
          ...card,
          id: card.id + 100000, // Unique ID for evolution
          name: `${card.name} (Evolution)`,
          iconUrls: {
            medium: card.iconUrls.evolutionMedium!,
            evolutionMedium: card.iconUrls.evolutionMedium
          },
          isEvolution: true
        }));
      
      setAllCards([...regularCards, ...evolutionCards]);
    } catch (err) {
      setError('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (card: Card) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 8) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const searchVideos = async () => {
    if (selectedCards.length !== 8) {
      setError('Please select exactly 8 cards');
      return;
    }

    setSearching(true);
    setError('');

    try {
      // Remove "(Evolution)" suffix for cleaner search - USE ALL 8 CARDS
      const allCardNames = selectedCards.map(c => c.name.replace(' (Evolution)', ''));
      
      // Check if deck has evolutions
      const hasEvolutions = selectedCards.some(c => c.name.includes('(Evolution)'));
      
      // Trusted Clash Royale channels for faster, quality results
      const trustedChannels = [
        'Clash Royale',
        'B-Rad Gaming',
        'Clash with Ash',
        'OJ',
        'Surgical Goblin',
        'Clash Royale Esports',
      ];

      // Calculate date filters for recent videos only
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      
      const publishedAfter1Year = oneYearAgo.toISOString();
      const publishedAfter2Years = twoYearsAgo.toISOString();
      const publishedAfter6Months = sixMonthsAgo.toISOString();

      // Create search strategies with DATE FILTERS and HIGHER RESULT COUNTS
      const searchStrategies = [
        // Strategy 1: Last 6 months - Trusted channels (HIGHEST PRIORITY)
        ...trustedChannels.slice(0, 4).map(channel => ({
          query: `Clash Royale ${allCardNames.slice(0, 6).join(' ')} deck`,
          channelName: channel,
          publishedAfter: publishedAfter6Months,
          maxResults: 50,
          order: 'relevance' as const,
          priority: 'high'
        })),
        
        // Strategy 2: Last 1 year - Full deck with all 8 cards
        {
          query: `Clash Royale ${allCardNames.join(' ')} deck`,
          publishedAfter: publishedAfter1Year,
          maxResults: 50,
          order: 'relevance' as const,
          priority: 'high'
        },
        
        // Strategy 3: Last 1 year - Recent evolution deck (if has evolutions)
        hasEvolutions ? {
          query: `Clash Royale evolution ${allCardNames.slice(0, 7).join(' ')} deck`,
          publishedAfter: publishedAfter1Year,
          maxResults: 50,
          order: 'relevance' as const,
          priority: 'high'
        } : null,
        
        // Strategy 4: Last 1 year - Deck guide
        {
          query: `Clash Royale ${allCardNames.slice(0, 7).join(' ')} deck guide`,
          publishedAfter: publishedAfter1Year,
          maxResults: 50,
          order: 'relevance' as const,
          priority: 'high'
        },
        
        // Strategy 5: Last 1 year - Best deck
        {
          query: `Clash Royale best ${allCardNames.slice(0, 6).join(' ')} deck`,
          publishedAfter: publishedAfter1Year,
          maxResults: 50,
          order: 'relevance' as const,
          priority: 'medium'
        },
        
        // Strategy 6: Last 2 years - Meta deck (broader time range)
        {
          query: `Clash Royale ${allCardNames.slice(0, 6).join(' ')} deck meta`,
          publishedAfter: publishedAfter2Years,
          maxResults: 50,
          order: 'relevance' as const,
          priority: 'medium'
        },
        
        // Strategy 7: Last 1 year - Strategy guide
        {
          query: `Clash Royale ${allCardNames.slice(0, 5).join(' ')} deck strategy`,
          publishedAfter: publishedAfter1Year,
          maxResults: 50,
          order: 'relevance' as const,
          priority: 'medium'
        },
        
        // Strategy 8: Last 1 year - Gameplay (broader search)
        {
          query: `Clash Royale ${allCardNames.slice(0, 5).join(' ')} gameplay`,
          publishedAfter: publishedAfter1Year,
          maxResults: 50,
          order: 'relevance' as const,
          priority: 'low'
        }
      ].filter(Boolean); // Remove null values

      // Execute all searches in parallel for better performance
      const searchPromises = searchStrategies.map(async (strategy: any) => {
        try {
          const url = new URL('/api/youtube/search', window.location.origin);
          url.searchParams.set('q', strategy.query);
          url.searchParams.set('maxResults', String(strategy.maxResults || 50));
          url.searchParams.set('order', strategy.order || 'relevance');
          
          if (strategy.channelName) {
            url.searchParams.set('channelName', strategy.channelName);
          }
          
          if (strategy.publishedAfter) {
            url.searchParams.set('publishedAfter', strategy.publishedAfter);
          }

          const response = await fetch(url.toString());
          const data = await response.json();
          return { videos: data.videos || [], priority: strategy.priority };
        } catch (err) {
          console.error('Search strategy failed:', strategy.query, err);
          return { videos: [], priority: strategy.priority };
        }
      });

      // Wait for all searches to complete
      const searchResults = await Promise.all(searchPromises);
      
      // Collect unique videos, prioritizing trusted channel results
      const seenVideoIds = new Set<string>();
      const allVideos: Video[] = [];
      const trustedChannelNames = trustedChannels.map(c => c.toLowerCase());
      
      // Process high priority (trusted channels) first
      for (const result of searchResults) {
        for (const video of result.videos) {
          if (!seenVideoIds.has(video.id)) {
            seenVideoIds.add(video.id);
            allVideos.push(video);
          }
        }
      }

      // Fetch transcripts for all videos (searches INSIDE video content)
      setFetchingTranscripts(true);
      console.log(`Fetching transcripts for ${allVideos.length} videos...`);
      const videoIds = allVideos.map(v => v.id);
      let transcriptsMap = new Map<string, string>();
      
      try {
        // Fetch transcripts in batches (to avoid rate limits)
        const batchSize = 10;
        for (let i = 0; i < videoIds.length; i += batchSize) {
          const batch = videoIds.slice(i, i + batchSize);
          try {
            const response = await fetch(
              `/api/youtube/transcript?videoIds=${batch.join(',')}`
            );
            const data = await response.json();
            if (data.transcripts) {
              Object.entries(data.transcripts).forEach(([id, transcript]: [string, any]) => {
                if (transcript && transcript.length > 0) {
                  transcriptsMap.set(id, transcript);
                }
              });
            }
          } catch (batchErr) {
            console.warn(`Failed to fetch batch ${i / batchSize + 1}:`, batchErr);
            // Continue with next batch
          }
          
          // Small delay between batches
          if (i + batchSize < videoIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        console.log(`Fetched ${transcriptsMap.size} transcripts out of ${videoIds.length} videos`);
      } catch (err) {
        console.error('Error fetching transcripts:', err);
        // Continue without transcripts - will use title/description only
      } finally {
        setFetchingTranscripts(false);
      }

      // Helper function to check if card name appears in text (with word boundaries)
      const cardNameMatches = (text: string, cardName: string): boolean => {
        const normalizedText = text.toLowerCase();
        const normalizedCardName = cardName.toLowerCase();
        
        // Exact match
        if (normalizedText.includes(normalizedCardName)) {
          return true;
        }
        
        // Handle common variations (e.g., "Hog Rider" vs "Hog")
        const words = normalizedCardName.split(' ');
        if (words.length > 1) {
          // Check if all words appear (for multi-word cards)
          const allWordsPresent = words.every(word => normalizedText.includes(word));
          if (allWordsPresent) return true;
        }
        
        return false;
      };

      // Filter and score videos based on EXACT CARD MATCHES (including transcripts)
      const scoredVideos = allVideos
        .map(video => {
          const titleLower = video.title.toLowerCase();
          const descLower = video.description.toLowerCase();
          const transcript = transcriptsMap.get(video.id) || '';
          const transcriptLower = transcript.toLowerCase();
          
          // Combine all text sources for searching
          const fullText = `${titleLower} ${descLower} ${transcriptLower}`;
          
          // Must mention "clash royale"
          const isClashRoyale = 
            titleLower.includes('clash royale') || 
            titleLower.includes('cr deck') ||
            titleLower.includes('clash') ||
            descLower.includes('clash royale') ||
            transcriptLower.includes('clash royale');
          
          if (!isClashRoyale) return null;
          
          // COUNT how many of the 8 cards are mentioned (PRIMARY RANKING FACTOR)
          // Now searches in: title, description, AND video transcript
          let cardsMatched = 0;
          const matchedCards: string[] = [];
          const matchSources: { [key: string]: string[] } = {}; // Track where each card was found
          
          selectedCards.forEach(card => {
            const cardName = card.name.replace(' (Evolution)', '').toLowerCase();
            const sources: string[] = [];
            
            // Check title
            if (cardNameMatches(titleLower, cardName)) {
              sources.push('title');
            }
            
            // Check description
            if (cardNameMatches(descLower, cardName)) {
              sources.push('description');
            }
            
            // Check transcript (most important - searches INSIDE video)
            if (transcript && cardNameMatches(transcriptLower, cardName)) {
              sources.push('transcript');
            }
            
            // If found in any source, count it
            if (sources.length > 0) {
              cardsMatched++;
              matchedCards.push(card.name);
              matchSources[card.name] = sources;
            }
          });
          
          // FILTER OUT videos that don't mention enough cards (minimum 3 out of 8 for more results)
          // Lowered from 4 to 3 to get more videos, especially from transcript matches
          if (cardsMatched < 3) {
            return null;
          }
          
          // PRIMARY SCORE: Card match count (heavily weighted)
          // Videos with more card matches get exponentially higher scores
          let score = 0;
          
          // Exponential bonus for card matches (8 cards = 1000 points, 7 = 500, 6 = 250, etc.)
          if (cardsMatched === 8) score += 1000;      // Perfect match!
          else if (cardsMatched === 7) score += 500;  // Almost perfect
          else if (cardsMatched === 6) score += 250;   // Very good match
          else if (cardsMatched === 5) score += 100;   // Good match
          else if (cardsMatched === 4) score += 50;    // Good match
          else if (cardsMatched === 3) score += 25;    // Minimum match (lowered threshold)
          
          // Bonus for cards mentioned in TITLE (more visible = more relevant)
          let titleMatches = 0;
          let transcriptMatches = 0;
          selectedCards.forEach(card => {
            const cardName = card.name.replace(' (Evolution)', '').toLowerCase();
            if (cardNameMatches(titleLower, cardName)) {
              titleMatches++;
              score += 20; // Extra points for title mentions
            }
            // BIG BONUS for transcript matches (searched inside video)
            if (transcript && cardNameMatches(transcriptLower, cardName)) {
              transcriptMatches++;
              score += 30; // Even more points for transcript matches
            }
          });
          
          // BONUS: Trusted channel priority (FASTER, HIGHER QUALITY)
          const isTrustedChannel = trustedChannelNames.some(channel => 
            video.channelTitle.toLowerCase().includes(channel)
          );
          if (isTrustedChannel) {
            score += 50; // Significant bonus for trusted channels
          }
          
          // Bonus for evolution content if deck has evolutions
          if (hasEvolutions && (titleLower.includes('evolution') || titleLower.includes('evo'))) {
            score += 15;
          }
          
          // Recency scoring (secondary to card matches)
          const publishDate = new Date(video.publishedAt);
          const monthsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          
          if (monthsOld < 3) score += 20;   // Last 3 months
          else if (monthsOld < 6) score += 10;  // Last 6 months
          else if (monthsOld < 12) score += 5;   // Last year
          else if (monthsOld > 24) score -= 5;  // Over 2 years old
          else if (monthsOld > 36) score -= 10; // Over 3 years old
          
          // Bonus for year in title (indicates recent/relevant content)
          if (titleLower.includes('2025')) score += 10;
          if (titleLower.includes('2024')) score += 8;
          if (titleLower.includes('2023')) score += 3;
          
          // Small bonuses for relevant keywords
          if (titleLower.includes('guide')) score += 5;
          if (titleLower.includes('deck')) score += 5;
          if (titleLower.includes('best')) score += 3;
          if (titleLower.includes('meta')) score += 3;
          if (titleLower.includes('strategy')) score += 3;
          
          return { 
            video, 
            score, 
            cardsMatched, 
            titleMatches,
            matchedCards 
          };
        })
        .filter(item => item !== null && item.cardsMatched >= 3) // Only videos with 3+ card matches (lowered for more results)
        .sort((a, b) => {
          // Primary sort: Card match count (descending)
          if (b!.cardsMatched !== a!.cardsMatched) {
            return b!.cardsMatched - a!.cardsMatched;
          }
          // Secondary sort: Score (descending)
          return b!.score - a!.score;
        })
        .slice(0, 24) // Take top 24 most relevant
        .map(item => item!.video);

      setVideos(scoredVideos);
      setView('results');
      
      if (scoredVideos.length === 0) {
        setError('No relevant videos found. Try selecting more popular meta cards.');
      }
    } catch (err) {
      setError('Failed to search videos');
      console.error('YouTube search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const resetDeck = () => {
    setSelectedCards([]);
    setVideos([]);
    setView('selector');
    setError('');
  };

  // Filter cards based on search term and evolution toggle
  const filteredCards = allCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isEvolutionCard = card.name.includes('(Evolution)');
    
    if (showEvolutions) {
      return matchesSearch && isEvolutionCard;
    } else {
      return matchesSearch && !isEvolutionCard;
    }
  });

  const avgElixir = selectedCards.length > 0
    ? (selectedCards.reduce((sum, c) => sum + (c.elixirCost || 0), 0) / selectedCards.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Deck Builder</h1>
          <p className="text-gray-400">Select 8 cards to find strategy videos</p>
        </div>

        {view === 'selector' ? (
          <>
            {/* Selected Cards Bar */}
            <div className="bg-slate-900 rounded-xl p-4 mb-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">
                    Selected: {selectedCards.length}/8
                  </span>
                  {selectedCards.length === 8 && (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Ready to search
                    </span>
                  )}
                  {selectedCards.length > 0 && (
                    <span className="text-blue-400 text-sm">
                      Avg: {avgElixir} elixir
                    </span>
                  )}
                </div>
                {selectedCards.length > 0 && (
                  <button
                    onClick={resetDeck}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Selected Cards Grid */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                {[...Array(8)].map((_, i) => {
                  const card = selectedCards[i];
                  return (
                    <div
                      key={i}
                      className="aspect-square bg-slate-800 rounded-lg border-2 border-slate-700 flex items-center justify-center relative overflow-hidden"
                    >
                      {card ? (
                        <>
                          <img
                            src={card.iconUrls.medium}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                          {card.name.includes('(Evolution)') && (
                            <div className="absolute top-0 left-0 bg-purple-600 text-white p-0.5 rounded-br">
                              <Sparkles className="h-3 w-3" />
                            </div>
                          )}
                          <button
                            onClick={() => toggleCard(card)}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-600 text-2xl font-bold">{i + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Search Button */}
              <button
                onClick={searchVideos}
                disabled={selectedCards.length !== 8 || searching}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {fetchingTranscripts ? 'Searching inside videos...' : 'Searching for deck guides...'}
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Find Strategy Videos
                  </>
                )}
              </button>

              {error && (
                <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
              )}
            </div>

            {/* Search Bar with Evolution Toggle */}
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowEvolutions(!showEvolutions)}
                className={`px-4 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
                  showEvolutions
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Sparkles className="h-5 w-5" />
                {showEvolutions ? 'Evolutions' : 'Regular'}
              </button>
            </div>

            {/* Info Banner */}
            {showEvolutions && (
              <div className="mb-4 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                <p className="text-purple-300 text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Viewing evolution cards - these are powered-up versions with special abilities
                </p>
              </div>
            )}

            {/* All Cards Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {filteredCards.map(card => {
                const isSelected = selectedCards.find(c => c.id === card.id);
                const isEvolution = card.name.includes('(Evolution)');
                
                return (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card)}
                    disabled={!isSelected && selectedCards.length >= 8}
                    className={`relative aspect-square rounded-lg overflow-hidden transition ${
                      isSelected
                        ? 'ring-4 ring-blue-500 scale-95'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    } ${!isSelected && selectedCards.length >= 8 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <img
                      src={card.iconUrls.medium}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                    {isEvolution && (
                      <div className="absolute top-0 left-0 bg-purple-600 text-white p-1 rounded-br">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
                          {selectedCards.findIndex(c => c.id === card.id) + 1}
                        </div>
                      </div>
                    )}
                    {card.elixirCost && (
                      <div className="absolute bottom-1 right-1 bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        {card.elixirCost}
                      </div>
                    )}
                    {/* Card name tooltip on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 text-white text-xs p-1 text-center opacity-0 hover:opacity-100 transition-opacity">
                      {card.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredCards.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No cards found matching "{searchTerm}"</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results View */}
            <div className="mb-6 bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Strategy Videos</h2>
                  <p className="text-gray-400 text-sm">
                    {videos.length > 0 
                      ? `Found ${videos.length} videos from the last 1-2 years matching 3+ of your 8 cards (includes transcript matches)`
                      : 'No recent videos found matching at least 3 of your cards - try different cards'}
                  </p>
                </div>
                <button
                  onClick={resetDeck}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Swords className="h-4 w-4" />
                  New Search
                </button>
              </div>

              {/* Selected Deck Preview */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {selectedCards.map(card => (
                  <div key={card.id} className="relative w-12 h-12 rounded border-2 border-slate-700 overflow-hidden">
                    <img src={card.iconUrls.medium} alt={card.name} className="w-full h-full object-cover" />
                    {card.name.includes('(Evolution)') && (
                      <div className="absolute top-0 left-0 bg-purple-600 text-white p-0.5 rounded-br">
                        <Sparkles className="h-2 w-2" />
                      </div>
                    )}
                  </div>
                ))}
                <span className="text-blue-400 text-sm ml-2">Avg: {avgElixir} elixir</span>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(video => {
                // Calculate how many cards match this video
                const fullText = `${video.title.toLowerCase()} ${video.description.toLowerCase()}`;
                let cardsMatched = 0;
                selectedCards.forEach(card => {
                  const cardName = card.name.replace(' (Evolution)', '').toLowerCase();
                  if (fullText.includes(cardName)) {
                    cardsMatched++;
                  }
                });
                
                // Check if from trusted channel
                const trustedChannels = [
                  'Clash Royale',
                  'B-Rad Gaming',
                  'Clash with Ash',
                  'OJ',
                  'Surgical Goblin',
                  'Clash Royale Esports',
                ];
                const isTrustedChannel = trustedChannels.some(channel => 
                  video.channelTitle.toLowerCase().includes(channel.toLowerCase())
                );
                
                // Calculate match percentage and color
                const matchPercentage = Math.round((cardsMatched / 8) * 100);
                let matchColor = 'bg-red-500';
                if (matchPercentage >= 100) matchColor = 'bg-green-500';
                else if (matchPercentage >= 87) matchColor = 'bg-green-400';
                else if (matchPercentage >= 75) matchColor = 'bg-yellow-500';
                else if (matchPercentage >= 62) matchColor = 'bg-orange-500';
                
                // Calculate how old the video is
                const publishDate = new Date(video.publishedAt);
                const now = new Date();
                const daysOld = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
                
                let ageLabel = '';
                let ageColor = 'text-gray-400';
                
                if (daysOld < 7) {
                  ageLabel = 'New';
                  ageColor = 'text-green-400';
                } else if (daysOld < 30) {
                  ageLabel = `${daysOld} days ago`;
                  ageColor = 'text-blue-400';
                } else if (daysOld < 365) {
                  ageLabel = `${Math.floor(daysOld / 30)} months ago`;
                  ageColor = 'text-yellow-400';
                } else {
                  ageLabel = `${Math.floor(daysOld / 365)} years ago`;
                  ageColor = 'text-red-400';
                }
                
                return (
                  <div key={video.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500 transition">
                    <div className="relative">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full aspect-video object-cover"
                      />
                      {/* Card Match Badge - Top Left */}
                      <div className={`absolute top-2 left-2 ${matchColor} text-white px-2 py-1 rounded text-xs font-bold`}>
                        {cardsMatched}/8 cards
                      </div>
                      {/* Trusted Channel Badge - Bottom Left */}
                      {isTrustedChannel && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Trusted
                        </div>
                      )}
                      {/* Age Badge - Top Right */}
                      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold">
                        <span className={ageColor}>{ageLabel}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                        <a
                          href={`https://www.youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700"
                        >
                          <Play className="h-6 w-6" />
                        </a>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">{video.channelTitle}</p>
                      <p className="text-gray-500 text-xs line-clamp-2">{video.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {videos.length === 0 && !searching && (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No videos found matching your deck</p>
                <p className="text-gray-500 text-sm mb-2">
                  Videos must mention at least <span className="text-blue-400 font-semibold">3 of your 8 cards</span> and be from the last 1-2 years.
                  <br />
                  <span className="text-blue-300">Search includes video transcripts, not just titles/descriptions.</span>
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  This deck might be too unique. Try:
                </p>
                <ul className="text-gray-500 text-sm space-y-1 max-w-md mx-auto text-left">
                  <li>• Replacing 1-2 cards with more popular meta cards</li>
                  <li>• Using common cards like Hog Rider, Giant, X-Bow, or Royal Giant</li>
                  <li>• Checking if card names are spelled correctly</li>
                </ul>
                <button
                  onClick={resetDeck}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Try Different Cards
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}