'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Swords, Shield, TrendingUp, Video, Upload, Search } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Clash Vision</h1>
        <p className="text-gray-400">Your AI-powered strategy companion for Clash games</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800 hover:border-blue-500 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Swords className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Clash Royale</CardTitle>
                <CardDescription>Search decks and find strategies</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-400 text-sm">
              Upload deck screenshots or search for top meta decks with video guides
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/clash-royale" className="flex-1">
                <Button className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search Decks
                </Button>
              </Link>
              <Link href="/dashboard/clash-royale/upload" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-orange-500 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Clash of Clans</CardTitle>
                <CardDescription>Find base attack strategies</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-400 text-sm">
              Upload base screenshots to discover attack replays and army compositions
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/clash-of-clans" className="flex-1">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <Search className="mr-2 h-4 w-4" />
                  Search Bases
                </Button>
              </Link>
              <Link href="/dashboard/clash-of-clans/upload" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-400" />
              Saved Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm mb-4">Quick access to your saved strategy videos</p>
            <Link href="/dashboard/saved">
              <Button variant="outline" className="w-full">View All</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Meta Decks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm mb-4">Explore current top-performing decks</p>
            <Link href="/dashboard/clash-royale/meta">
              <Button variant="outline" className="w-full">View Meta</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-400" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm mb-4">Review your search history</p>
            <Link href="/dashboard/history">
              <Button variant="outline" className="w-full">View History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-linear-to-r from-blue-900 to-purple-900 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Upgrade to Premium</h3>
              <p className="text-gray-200 text-sm">Unlock unlimited searches, priority matching, and more</p>
            </div>
            <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}