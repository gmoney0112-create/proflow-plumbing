import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

app.get('/apis', async (req: Request, res: Response) => {
  const {
    q,
    category,
    auth_type,
    limit = '20',
    offset = '0',
  } = req.query as Record<string, string>;

  let query = supabase.from('apis').select('*');

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (auth_type) {
    query = query.eq('auth_type', auth_type);
  }

  const { data, error } = await query.range(
    Number(offset),
    Number(offset) + Number(limit) - 1
  );

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

app.get('/apis/random', async (req: Request, res: Response) => {
  const { category } = req.query as Record<string, string>;

  let query = supabase.from('apis').select('*').limit(100);
  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'No APIs found' });

  const random = data[Math.floor(Math.random() * data.length)];
  return res.json(random);
});

app.get('/apis/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { data, error } = await supabase
    .from('apis')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return res.status(404).json({ error: 'Not found' });
  return res.json(data);
});

app.get('/categories', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('apis')
    .select('category')
    .not('category', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  const counts = (data as { category: string }[]).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.category] = (acc[row.category] || 0) + 1;
      return acc;
    },
    {}
  );

  return res.json(
    Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  );
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`API catalog server running on port ${port}`);
});
