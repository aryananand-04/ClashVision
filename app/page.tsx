import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Swords, Crown, Search, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-white flex items-center gap-2">
          <Crown className="h-8 w-8 text-blue-400" />
          Clash Vision
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:text-white/80">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Master Every Battle
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              With AI Power
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Upload any base or deck screenshot. Get instant strategy matches from thousands of YouTube videos. 
            Dominate Clash of Clans and Clash Royale.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                <Search className="mr-2 h-5 w-5" />
                Explore
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <Search className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Screenshot Search</h3>
              <p className="text-gray-300">
                Upload any base or deck. Find matching videos instantly.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <Swords className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Strategy Matching</h3>
              <p className="text-gray-300">
                Get exact timestamps and army compositions from pro replays.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <Crown className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Meta Insights</h3>
              <p className="text-gray-300">
                Track top decks, balance changes, and win rate predictions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}