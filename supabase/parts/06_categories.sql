-- ---------------------------------------------------------------------------
-- Menu categories (Men). Safe to re-run: adds missing ones and sets the menu
-- order; names and descriptions you edit in Admin -> Categories are kept.
-- Keep in sync with src/lib/commerce/default-categories.ts and supabase/gen_seed.py.
-- ---------------------------------------------------------------------------
insert into public.categories (legacy_id, slug, name, gender, description, sort_order) values
  ('epic-cat-formal-suits',  'formal-suits',  'Formal Suits',  'men', 'Two-piece, three-piece, double-breasted and tuxedo suits.', 1),
  ('epic-cat-formal-shirts', 'formal-shirts', 'Formal Shirts', 'men', 'Dress shirts, French cuff and tuxedo shirts.', 2),
  ('epic-cat-formal-shoes',  'formal-shoes',  'Formal Shoes',  'men', 'Oxfords, loafers and patent tuxedo shoes.', 3),
  ('epic-cat-casual-shoes',  'casual-shoes',  'Casual Shoes',  'men', 'Leather sneakers, boots and driving loafers.', 4),
  ('epic-cat-accessories',   'accessories',   'Accessories',   'men', 'Ties, bow ties, belts, pocket squares and cufflinks.', 5)
on conflict (slug) do update
  set sort_order = excluded.sort_order,
      is_active  = true;
