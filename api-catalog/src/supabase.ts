import { createClient } from '@supabase/supabase-js';
import { ApiRecord } from './types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CHUNK_SIZE = 500;

export async function upsertApis(records: ApiRecord[]): Promise<void> {
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('apis')
      .upsert(chunk, { onConflict: 'slug' });

    if (error) {
      console.error(`Upsert error at chunk starting at index ${i}:`, error);
      throw error;
    }

    console.log(
      `Upserted records ${i + 1}–${Math.min(i + CHUNK_SIZE, records.length)} of ${records.length}`
    );
  }
}
