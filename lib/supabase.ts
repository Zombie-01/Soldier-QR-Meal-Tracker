import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Soldier {
  id: string;
  soldier_id: string;
  name: string;
  total_meals: number;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  last_scan: string;
  created_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export function getCurrentMealType(): MealType | null {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 16 && hour < 21) return 'dinner';

  return null;
}

export function parseQRCode(qrData: string): { soldier_id: string; name: string } | null {
  try {
    const parts = qrData.split(':'); // Splits the string by the colon ':'

    let soldier_id = qrData;
    let name = parts[5];

   
    if (soldier_id && name) {
      return { soldier_id, name };
    }

    return null;
  } catch (error) {
    return null;
  }
}
