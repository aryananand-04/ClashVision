'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface TestResult {
  name: string;
  status: TestStatus;
  message: string;
  data?: any;
}

export default function APITestPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [playerTag, setPlayerTag] = useState('#2PP');
  const [testing, setTesting] = useState(false);

  const updateTest = (name: string, status: TestStatus, message: string, data?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { name, status, message, data } : t);
      }
      return [...prev, { name, status, message, data }];
    });
  };

  const runAllTests = async () => {
    setTesting(true);
    setTests([]);

    // Test 1: Check Environment Variables
    updateTest('Environment', 'loading', 'Checking API keys...');
    try {
      const envResponse = await axios.get('/api/test-env');
      const hasClash = !!envResponse.data.CLASH;
      const hasYT = !!envResponse.data.YT;
      
      if (hasClash && hasYT) {
        updateTest('Environment', 'success', '✅ All API keys configured');
      } else if (hasClash) {
        updateTest('Environment', 'error', '⚠️ Clash Royale key found, YouTube key missing');
      } else {
        updateTest('Environment', 'error', '❌ API keys not configured in .env.local');
      }
    } catch (error) {
      updateTest('Environment', 'error', '❌ Cannot check environment variables');
    }

    // Test 2: Fetch Cards
    updateTest('Cards API', 'loading', 'Fetching all cards...');
    try {
      const cardsResponse = await axios.get('/api/clash-royale/cards');
      const cardCount = cardsResponse.data.count || 0;
      
      if (cardCount > 0) {
        updateTest('Cards API', 'success', `✅ Fetched ${cardCount} cards successfully`, {
          sample: cardsResponse.data.cards.slice(0, 3).map((c: any) => c.name)
        });
      } else {
        updateTest('Cards API', 'error', '⚠️ API returned 0 cards');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      updateTest('Cards API', 'error', `❌ ${errorMsg}`);
    }

    // Test 3: Fetch Player Profile
    updateTest('Player API', 'loading', `Searching for player ${playerTag}...`);
    try {
      const playerResponse = await axios.get(`/api/clash-royale/player?tag=${encodeURIComponent(playerTag)}`);
      const player = playerResponse.data.player;
      
      if (player) {
        updateTest('Player API', 'success', `✅ Found player: ${player.name}`, {
          trophies: player.trophies,
          deckCards: player.currentDeck.cards.length
        });
      } else {
        updateTest('Player API', 'error', '⚠️ Player not found');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      updateTest('Player API', 'error', `❌ ${errorMsg}`);
    }

    // Test 4: Fetch Challenges
    updateTest('Challenges API', 'loading', 'Fetching active challenges...');
    try {
      const challengesResponse = await axios.get('/api/clash-royale/challenges');
      const count = challengesResponse.data.count || 0;
      updateTest('Challenges API', 'success', `✅ Found ${count} active challenges`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      updateTest('Challenges API', 'error', `❌ ${errorMsg}`);
    }

    // Test 5: Analyze Deck
    updateTest('Deck Analysis', 'loading', 'Testing deck analysis...');
    try {
      const mockDeck = [
        { id: 1, name: 'Knight', level: 13, maxLevel: 14, iconUrl: '', elixir: 3, rarity: 'common' },
        { id: 2, name: 'Hog Rider', level: 11, maxLevel: 11, iconUrl: '', elixir: 4, rarity: 'rare' },
        { id: 3, name: 'Fireball', level: 11, maxLevel: 11, iconUrl: '', elixir: 4, rarity: 'rare' },
        { id: 4, name: 'Zap', level: 13, maxLevel: 14, iconUrl: '', elixir: 2, rarity: 'common' },
        { id: 5, name: 'Musketeer', level: 11, maxLevel: 11, iconUrl: '', elixir: 4, rarity: 'rare' },
        { id: 6, name: 'Ice Spirit', level: 13, maxLevel: 14, iconUrl: '', elixir: 1, rarity: 'common' },
        { id: 7, name: 'Cannon', level: 13, maxLevel: 14, iconUrl: '', elixir: 3, rarity: 'common' },
        { id: 8, name: 'The Log', level: 11, maxLevel: 11, iconUrl: '', elixir: 2, rarity: 'legendary' },
      ];
      
      const analysisResponse = await axios.post('/api/clash-royale/analyze-deck', { cards: mockDeck });
      const analysis = analysisResponse.data;
      
      updateTest('Deck Analysis', 'success', `✅ Archetype: ${analysis.archetype}, Avg Elixir: ${analysis.avgElixir}`, {
        composition: analysis.composition
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      updateTest('Deck Analysis', 'error', `❌ ${errorMsg}`);
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'loading': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">API Test Dashboard</h1>
        <p className="text-gray-400">Verify all Clash Royale API integrations are working</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Run API Tests</CardTitle>
          <CardDescription>Test all endpoints to ensure proper configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Player tag (e.g., #2PP)"
              value={playerTag}
              onChange={(e) => setPlayerTag(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Button onClick={runAllTests} disabled={testing}>
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
          </div>

          {tests.length > 0 && (
            <div className="space-y-3 mt-6">
              {tests.map((test, idx) => (
                <div key={idx} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{test.name}</h3>
                      <p className="text-sm text-gray-400">{test.message}</p>
                      {test.data && (
                        <pre className="mt-2 text-xs bg-slate-900 p-2 rounded text-gray-300 overflow-x-auto">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div>
            <strong className="text-white">1. Environment Variables</strong>
            <p>Create <code className="bg-slate-800 px-2 py-1 rounded">.env.local</code> file with:</p>
            <pre className="bg-slate-800 p-2 rounded mt-1 text-xs overflow-x-auto">
              CLASH_ROYALE_API_KEY=your_key_here
            </pre>
          </div>

          <div>
            <strong className="text-white">2. IP Whitelist</strong>
            <p>Make sure your IP (106.213.18.30) is whitelisted in the Clash Royale Developer Portal</p>
          </div>

          <div>
            <strong className="text-white">3. Restart Server</strong>
            <p>After adding .env.local, restart your dev server:</p>
            <pre className="bg-slate-800 p-2 rounded mt-1 text-xs">npm run dev</pre>
          </div>

          <div>
            <strong className="text-white">4. Common Issues</strong>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>403 Error = IP not whitelisted</li>
              <li>401 Error = Invalid/missing API key</li>
              <li>404 Error = Invalid player tag format</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}