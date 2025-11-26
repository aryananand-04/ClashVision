'use client';
import React, { useState, useEffect } from 'react';
import { Search, X, Swords, Loader2, Play, Check } from 'lucide-react';

// Types
interface Card {
  id: number;
  name: string;
  iconUrls: { medium: string };
  elixirCost?: number;
  rarity?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  description: string;
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

  // Load cards on mount
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch('/api/clash-royale/cards');
      const data = await response.json();
      setAllCards(data.cards || []);
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
      // Build search query
      const cardNames = selectedCards.map(c => c.name).join(' ');
      const query = `Clash Royale ${cardNames} deck guide strategy`;

      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=12`);
      const data = await response.json();

      setVideos(data.videos || []);
      setView('results');
    } catch (err) {
      setError('Failed to search videos');
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

  const filteredCards = allCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    Searching...
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

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* All Cards Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {filteredCards.map(card => {
                const isSelected = selectedCards.find(c => c.id === card.id);
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
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Results View */}
            <div className="mb-6 bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Strategy Videos</h2>
                  <p className="text-gray-400 text-sm">Found {videos.length} videos for your deck</p>
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
                  <div key={card.id} className="w-12 h-12 rounded border-2 border-slate-700 overflow-hidden">
                    <img src={card.iconUrls.medium} alt={card.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="text-blue-400 text-sm ml-2">Avg: {avgElixir} elixir</span>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(video => (
                <div key={video.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500 transition">
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover"
                    />
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
              ))}
            </div>

            {videos.length === 0 && !searching && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No videos found. Try a different deck!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

