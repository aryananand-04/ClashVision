'use client';

import { useState } from 'react';
import { useClashRoyale, useCards, usePlayerSearch } from '@/hooks/useClashRoyale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, TrendingUp, User, Swords } from 'lucide-react';

export default function ClashRoyaleDemo() {
  const { 
    loading: apiLoading, 
    error: apiError,
    fetchTopDecks,
    fetchMetaDecks,
    fetchCardStats,
    analyzeDeck,
  } = useClashRoyale();

  const { cards, loading: cardsLoading } = useCards();
  const { player, loading: playerLoading, error: playerError, searchPlayer } = usePlayerSearch();

  const [playerTag, setPlayerTag] = useState('');
  const [topDecks, setTopDecks] = useState<any[]>([]);
  const [metaDecks, setMetaDecks] = useState<any[]>([]);
  const [cardStats, setCardStats] = useState<any[]>([]);
  const [deckAnalysis, setDeckAnalysis] = useState<any>(null);

  const handlePlayerSearch = async () => {
    if (playerTag.trim()) {
      await searchPlayer(playerTag);
    }
  };

  const handleFetchTopDecks = async () => {
    const decks = await fetchTopDecks(10);
    setTopDecks(decks);
  };

  const handleFetchMetaDecks = async () => {
    const decks = await fetchMetaDecks(6000);
    setMetaDecks(decks);
  };

  const handleFetchCardStats = async () => {
    const stats = await fetchCardStats();
    setCardStats(stats);
  };

  const handleAnalyzePlayerDeck = async () => {
    if (player?.currentDeck?.cards) {
      const analysis = await analyzeDeck(player.currentDeck.cards);
      setDeckAnalysis(analysis);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Clash Royale API Demo</h1>
        <p className="text-gray-400">Test all Clash Royale API integrations</p>
      </div>

      {apiError && (
        <Card className="bg-red-900/20 border-red-500">
          <CardContent className="p-4">
            <p className="text-red-400">{apiError}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="player" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="player">
            <User className="h-4 w-4 mr-2" />
            Player
          </TabsTrigger>
          <TabsTrigger value="cards">
            <Swords className="h-4 w-4 mr-2" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="decks">
            <TrendingUp className="h-4 w-4 mr-2" />
            Top Decks
          </TabsTrigger>
          <TabsTrigger value="meta">Meta</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {/* Player Search Tab */}
        <TabsContent value="player">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Player Profile Search</CardTitle>
              <CardDescription>Search for any player by their player tag</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter player tag (e.g., #2PP)"
                  value={playerTag}
                  onChange={(e) => setPlayerTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePlayerSearch()}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button onClick={handlePlayerSearch} disabled={playerLoading}>
                  {playerLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {playerError && (
                <p className="text-red-400 text-sm">{playerError}</p>
              )}

              {player && (
                <div className="space-y-4 mt-4">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h3 className="text-xl font-bold text-white mb-2">{player.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Tag</p>
                        <p className="text-white font-mono">{player.tag}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Trophies</p>
                        <p className="text-white font-bold">{player.trophies}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Best Trophies</p>
                        <p className="text-white">{player.bestTrophies}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Win Rate</p>
                        <p className="text-white">
                          {((player.wins / (player.wins + player.losses)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {player.currentDeck && (
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-semibold text-white">Current Deck</h4>
                        <span className="text-blue-400 font-bold">
                          Avg: {player.currentDeck.averageElixir} elixir
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {player.currentDeck.cards.map((card: any) => (
                          <div key={card.id} className="text-center">
                            <img
                              src={card.iconUrl}
                              alt={card.name}
                              className="w-full rounded-lg mb-1"
                            />
                            <p className="text-xs text-white truncate">{card.name}</p>
                            <p className="text-xs text-blue-400">Lv {card.level}</p>
                          </div>
                        ))}
                      </div>
                      <Button 
                        onClick={handleAnalyzePlayerDeck} 
                        className="w-full mt-4"
                        disabled={apiLoading}
                      >
                        {apiLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          'Analyze Deck'
                        )}
                      </Button>
                    </div>
                  )}

                  {deckAnalysis && (
                    <div className="bg-slate-800 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Deck Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Archetype:</span>
                          <span className="text-white font-semibold">{deckAnalysis.archetype}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Troops:</span>
                          <span className="text-white">{deckAnalysis.composition.troops}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Spells:</span>
                          <span className="text-white">{deckAnalysis.composition.spells}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Buildings:</span>
                          <span className="text-white">{deckAnalysis.composition.buildings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Win Conditions:</span>
                          <span className="text-white">{deckAnalysis.composition.winConditions}</span>
                        </div>
                        
                        {deckAnalysis.counters.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-gray-400 mb-2">Weaknesses:</p>
                            <ul className="space-y-1">
                              {deckAnalysis.counters.map((counter: string, idx: number) => (
                                <li key={idx} className="text-red-400 text-xs">• {counter}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">All Cards</CardTitle>
              <CardDescription>Browse all {cards.length} Clash Royale cards</CardDescription>
            </CardHeader>
            <CardContent>
              {cardsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto">
                  {cards.map((card) => (
                    <div key={card.id} className="text-center">
                      <img
                        src={card.iconUrls.medium}
                        alt={card.name}
                        className="w-full rounded-lg mb-1"
                      />
                      <p className="text-xs text-white truncate">{card.name}</p>
                      {card.elixirCost && (
                        <p className="text-xs text-purple-400">{card.elixirCost} elixir</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Decks Tab */}
        <TabsContent value="decks">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Top Decks</CardTitle>
              <CardDescription>Most popular decks from top players</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleFetchTopDecks} disabled={apiLoading} className="mb-4">
                {apiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch Top Decks'
                )}
              </Button>

              {topDecks.length > 0 && (
                <div className="space-y-3">
                  {topDecks.map((deck, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-semibold">Deck #{idx + 1}</span>
                        <span className="text-sm text-gray-400">
                          Popularity: {deck.popularity}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Cards: {deck.cardNames?.join(', ') || 'Loading...'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Tab */}
        <TabsContent value="meta">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Meta Decks</CardTitle>
              <CardDescription>Top performing decks in high ladder</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleFetchMetaDecks} disabled={apiLoading}>
                {apiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch Meta Decks (6000+ trophies)'
                )}
              </Button>

              {metaDecks.length > 0 && (
                <div className="mt-4 space-y-3">
                  {metaDecks.map((deck, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-lg p-3">
                      <p className="text-white font-semibold">Meta Deck #{idx + 1}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Win Rate: {deck.winRate}% | Usage: {deck.usage}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Card Statistics</CardTitle>
              <CardDescription>Usage rates and performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleFetchCardStats} disabled={apiLoading}>
                {apiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch Card Stats'
                )}
              </Button>

              {cardStats.length > 0 && (
                <div className="mt-4">
                  <p className="text-green-400">Loaded {cardStats.length} card statistics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}