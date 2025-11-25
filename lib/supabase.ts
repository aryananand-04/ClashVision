import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const createSupabaseClient = () => {
  return createClientComponentClient();
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          is_premium: boolean;
          premium_until: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          premium_until?: string | null;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          premium_until?: string | null;
        };
      };
      saved_decks: {
        Row: {
          id: string;
          user_id: string;
          deck_name: string | null;
          cards: any;
          archetype: string | null;
          avg_elixir: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          deck_name?: string | null;
          cards: any;
          archetype?: string | null;
          avg_elixir?: number | null;
          notes?: string | null;
        };
      };
      saved_bases: {
        Row: {
          id: string;
          user_id: string;
          base_name: string | null;
          th_level: number | null;
          base_url: string | null;
          image_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          base_name?: string | null;
          th_level?: number | null;
          base_url?: string | null;
          image_url?: string | null;
          notes?: string | null;
        };
      };
      saved_videos: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          title: string | null;
          thumbnail: string | null;
          timestamp: number | null;
          game_type: string | null;
          related_deck: any | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          video_id: string;
          title?: string | null;
          thumbnail?: string | null;
          timestamp?: number | null;
          game_type?: string | null;
          related_deck?: any | null;
        };
      };
    };
  };
};