'use strict';
/* Yalla — Mhammad's personal journey app.
   All data lives in localStorage on this device. No accounts, no servers, no cost. */

/* ================= helpers ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function localDate(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pickN(rng, arr, n) {
  const pool = arr.slice(); const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

/* ================= data: meals =================
   Every meal is built from a low-cost Lebanese household pantry.
   kcal/pro are honest estimates for the stated portion; full = how long it keeps you full (1-5). */
const MEALS = [
  // ---- breakfasts ----
  { id: 'foul', en: 'Foul mdammas', ar: 'فول مدمس', slot: ['b', 'l'], e: '🫘', kcal: 430, pro: 21, full: 5, cost: 1, mins: 12,
    why: 'Fava beans are the cheapest fullness machine in the Lebanese kitchen — fiber and protein together.',
    recipe: 'Warm a can (or 2 cups cooked) fava beans with a splash of water · Mash lightly, add lemon juice, crushed garlic, salt, cumin · Drizzle 1 tbsp olive oil · Eat with 1 loaf bread, tomato and mint',
    boost: 'Add a chopped boiled egg on top — +7g protein for pennies.' },
  { id: 'balila', en: 'Balila', ar: 'بليلة', slot: ['b', 'l'], e: '🥣', kcal: 390, pro: 18, full: 4, cost: 1, mins: 10,
    why: 'Warm chickpeas with cumin and lemon — simple, filling, and endlessly cheap.',
    recipe: 'Heat 2 cups cooked chickpeas in a little of their water · Salt, lots of cumin, lemon juice, crushed garlic · 1 tbsp olive oil on top · Scoop with bread',
    boost: 'Stir in a spoon of yogurt or eat with a boiled egg.' },
  { id: 'baydbanadoura', en: 'Eggs in tomato', ar: 'بيض بالبندورة', slot: ['b', 'd'], e: '🍳', kcal: 360, pro: 19, full: 4, cost: 1, mins: 12,
    why: 'Eggs are the best protein-per-lira in the house. Tomato adds volume so you stay full.',
    recipe: 'Soften 1 chopped onion + 2 chopped tomatoes in a pan · Salt, pepper, pinch of chili · Crack 3 eggs on top, cover 4 min · Eat with 1 loaf bread',
    boost: 'Use 2 whole eggs + 2 extra whites if eggs are plentiful this week.' },
  { id: 'ejjeh', en: 'Ejjeh (herb omelet)', ar: 'عجة', slot: ['b', 'd'], e: '🌿', kcal: 380, pro: 20, full: 4, cost: 1, mins: 15,
    why: 'Parsley, onion and mint stretch 3 eggs into a big satisfying meal.',
    recipe: 'Whisk 3 eggs with a big handful chopped parsley, 1 small onion, dried mint, salt, 2 tbsp flour · Pan-fry as small patties in a little oil (or bake) · Serve with laban and cucumber',
    boost: 'Serve with a cup of laban — +8g protein.' },
  { id: 'labnehplate', en: 'Labneh plate', ar: 'لبنة وخضرة', slot: ['b', 'd'], e: '🥒', kcal: 350, pro: 15, full: 3, cost: 1, mins: 5,
    why: 'The classic. Keep the labneh thick, the oil light, and load up the cucumber.',
    recipe: 'Spread 4 heaped tbsp labneh · 1 tsp olive oil, pinch dried mint or zaatar · Cucumber, tomato, olives on the side · 1 loaf bread — portion it, don\'t inhale the bag',
    boost: 'Add a boiled egg or a slice of white cheese alongside.' },
  { id: 'eggszaatar', en: 'Boiled eggs + zaatar dip', ar: 'بيض مسلوق وزعتر', slot: ['b'], e: '🥚', kcal: 380, pro: 20, full: 4, cost: 1, mins: 12,
    why: 'Boiled eggs digest slowly — this breakfast quietly kills mid-morning cravings.',
    recipe: 'Boil 3 eggs (8 min) · Small dish of zaatar + olive oil for dipping · Tomato and cucumber on the side · 1 loaf bread',
    boost: 'Already strong — add laban if you trained this morning.' },
  { id: 'laban_banana', en: 'Laban + banana bowl', ar: 'لبن وموز', slot: ['b'], e: '🍌', kcal: 330, pro: 15, full: 3, cost: 1, mins: 4,
    why: 'Cold, slightly sweet, and fast — a breakfast that feels like a treat.',
    recipe: 'Big bowl of laban (2 cups) · Sliced banana · Cinnamon on top · Handful of crushed qdameh or oats if you have them',
    boost: 'Whisk a scoop of pea protein into the laban first — this becomes a 35g-protein breakfast for almost nothing.' },
  { id: 'halloumitoast', en: 'Pan-grilled cheese + veg', ar: 'جبنة مشوية', slot: ['b', 'd'], e: '🧀', kcal: 410, pro: 22, full: 4, cost: 2, mins: 10,
    why: 'Grilled akkawi or halloumi-style cheese is protein that tastes like a reward.',
    recipe: 'Dry-pan slices of white cheese till golden both sides · Tuck into bread with tomato, cucumber, mint · Squeeze of lemon',
    boost: 'Add a fried egg in the same pan.' },
  { id: 'msabbaha', en: 'Msabbaha', ar: 'مسبحة', slot: ['b', 'l'], e: '🫓', kcal: 440, pro: 19, full: 5, cost: 1, mins: 15,
    why: 'Warm whole chickpeas in loose hummus — heavier than hummus alone, keeps you full till lunch.',
    recipe: 'Warm 2 cups cooked chickpeas · Mash half with 2 tbsp tahini, lemon, garlic, some cooking water · Fold whole ones back in · Olive oil, cumin, parsley · Scoop with 1 loaf bread',
    boost: 'Top with a boiled egg — a classic combo.' },
  { id: 'tunatoast', en: 'Tuna & labneh toast', ar: 'تونة ولبنة', slot: ['b', 'd'], e: '🐟', kcal: 340, pro: 26, full: 3, cost: 2, mins: 5,
    why: 'One can of tuna = 25g protein. The labneh makes it creamy without mayo.',
    recipe: 'Drain 1 can tuna, mix with 1 tbsp labneh, lemon, black pepper · Pile on toasted bread · Cucumber slices on top',
    boost: 'Already the protein king of breakfasts.' },

  // ---- lunches (mains) ----
  { id: 'mujadara', en: 'Mujadara', ar: 'مجدرة', slot: ['l', 'd'], e: '🍚', kcal: 560, pro: 22, full: 5, cost: 1, mins: 40,
    why: 'Lentils + rice = complete protein, and the fiber keeps you full for hours. The king of budget meals.',
    recipe: 'Boil 1 cup lentils 15 min · Add ¾ cup rice, 2½ cups water, salt, cumin · Simmer covered 20 min · Slowly caramelize 2 sliced onions in olive oil until deep brown, pile on top · Serve with laban or salad',
    boost: 'A bowl of laban w khyar on the side adds ~10g protein and makes it a feast.' },
  { id: 'mdardara', en: 'Mdardara', ar: 'مدردرة', slot: ['l', 'd'], e: '🧅', kcal: 540, pro: 20, full: 5, cost: 1, mins: 40,
    why: 'Mujadara\'s cousin with whole grains showing — same cheap, same filling.',
    recipe: 'Cook 1 cup lentils till just tender · Cook ¾ cup rice or burghul separately · Fold together with salt and cumin · Top with crispy fried onions · Big plate of salad next to it',
    boost: 'Laban on the side, always.' },
  { id: 'adassoup', en: 'Shorbet adas', ar: 'شوربة عدس', slot: ['l', 'd'], e: '🍲', kcal: 420, pro: 20, full: 4, cost: 1, mins: 30,
    why: 'Soup tricks your stomach into fullness with volume — science, but it tastes like home.',
    recipe: 'Sauté 1 onion · Add 1 cup red lentils, 1 grated carrot or potato, 4 cups water, salt, cumin, turmeric · Simmer 20 min, blend or leave rustic · Big lemon squeeze · 1 loaf toasted bread for dipping',
    boost: 'Croutons from oven-toasted bread beat fried — and a boiled egg on the side works.' },
  { id: 'fasoulia', en: 'Fasoulia w riz', ar: 'فاصوليا ورز', slot: ['l'], e: '🍛', kcal: 570, pro: 24, full: 5, cost: 1, mins: 45,
    why: 'White bean stew over rice — a Sunday-level meal from pantry staples.',
    recipe: 'Sauté onion + garlic · Add 2 cups cooked white beans, 2 tbsp tomato paste, 2 cups water, salt, 7-spice · Simmer 20 min till thick · Serve over 1 cup cooked rice',
    boost: 'If there\'s any meat or bones in the house, this is where they go. Otherwise beans carry it.' },
  { id: 'bazella', en: 'Bazella w riz', ar: 'بازيلا ورز', slot: ['l'], e: '🥕', kcal: 520, pro: 20, full: 4, cost: 1, mins: 35,
    why: 'Pea and carrot stew — light on the wallet, heavy in the stomach (the good way).',
    recipe: 'Sauté onion + garlic · Add 2 cups peas, 2 diced carrots, 2 tbsp tomato paste, 2 cups water · Salt, pepper, cinnamon pinch · Simmer 20 min · Over 1 cup rice',
    boost: 'Any minced meat stretches far here; or serve with laban.' },
  { id: 'adashamod', en: 'Adas b hamod', ar: 'عدس بحامض', slot: ['l', 'd'], e: '🍋', kcal: 430, pro: 19, full: 4, cost: 1, mins: 35,
    why: 'Lentils, greens, potato and lemon — sour, warm, and seriously filling.',
    recipe: 'Boil 1 cup lentils with 1 diced potato · Add chopped chard or spinach · Sauté garlic + cilantro in olive oil, tip into pot · Big lemon squeeze, simmer 10 min · Bread on the side',
    boost: 'This is a fiber bomb — add an egg or laban if it\'s the whole meal.' },
  { id: 'loubieh', en: 'Loubieh b zeit', ar: 'لوبية بزيت', slot: ['l', 'd'], e: '🫛', kcal: 470, pro: 14, full: 4, cost: 1, mins: 35,
    why: 'Green beans in tomato and olive oil, over rice or scooped with bread.',
    recipe: 'Sauté 1 sliced onion + 4 garlic cloves · Add 500g green beans, cook 5 min · 2 chopped tomatoes + 1 tbsp paste + ½ cup water · Simmer 20 min · With rice or bread',
    boost: 'Low protein on its own — pair with laban, egg, or a cheese side.' },
  { id: 'mloukhieh', en: 'Mloukhieh', ar: 'ملوخية', slot: ['l'], e: '🥬', kcal: 540, pro: 32, full: 4, cost: 2, mins: 45,
    why: 'When there\'s chicken in the house, this is the move — greens plus lean protein over rice.',
    recipe: 'Simmer chicken pieces till tender, shred · Cook mloukhieh leaves in the broth with lots of garlic + cilantro · Lemon at the end · Serve over rice with onion-vinegar',
    boost: 'Already high protein — keep your rice to 1 cup and go heavy on the greens.' },
  { id: 'rizadjej', en: 'Riz a djej (light)', ar: 'رز ع دجاج', slot: ['l'], e: '🍗', kcal: 600, pro: 38, full: 5, cost: 2, mins: 45,
    why: 'The celebration dish, portioned smart: more chicken, one cup of rice.',
    recipe: 'Simmer chicken with onion, cinnamon stick, bay leaf · Shred · Cook rice in the broth with allspice + cinnamon · Top with chicken (skip or minimize fried nuts) · Laban on the side',
    boost: 'Eat the chicken first, then the rice — you\'ll naturally eat less rice.' },
  { id: 'tawook', en: 'Pan shish tawook', ar: 'شيش طاووق', slot: ['l', 'd'], e: '🔥', kcal: 520, pro: 40, full: 4, cost: 2, mins: 25,
    why: 'Chicken breast marinated in laban + garlic + lemon — restaurant taste, home price.',
    recipe: 'Cube chicken breast, marinate 30 min in 3 tbsp laban, garlic, lemon, paprika, salt · Sear in hot pan till charred · Garlic-laban dip (laban + crushed garlic) · Bread + big salad',
    boost: 'The marinade laban + dip already boost it. Top protein meal.' },
  { id: 'tunapasta', en: 'Tuna pasta', ar: 'معكرونة بالتونة', slot: ['l', 'd'], e: '🍝', kcal: 550, pro: 30, full: 4, cost: 2, mins: 20,
    why: 'Pantry pasta with real protein — 20 minutes, one pot.',
    recipe: 'Boil 100g pasta · Sauté garlic + chili flakes in olive oil, add 1 chopped tomato or 1 tbsp paste · Fold in 1 can drained tuna + splash pasta water · Toss with pasta, lemon zest, parsley',
    boost: 'Use 1½ cans tuna if the jar allows — sauce holds it fine.' },
  { id: 'tunasalad', en: 'Tuna & chickpea bowl', ar: 'تونة وحمص', slot: ['l', 'd'], e: '🥗', kcal: 450, pro: 35, full: 4, cost: 2, mins: 10,
    why: 'No cooking, maximum protein. Chickpeas make the tuna go twice as far.',
    recipe: 'Mix 1 can tuna + 1½ cups cooked chickpeas · Chopped onion, tomato, cucumber, parsley · Lemon + 1 tbsp olive oil + salt + sumac if you have it',
    boost: 'This is already the highest-protein no-cook meal in the app.' },
  { id: 'sardines', en: 'Sardine plate', ar: 'سردين', slot: ['l', 'd'], e: '🐠', kcal: 420, pro: 28, full: 4, cost: 1, mins: 5,
    why: 'Canned sardines: cheap, packed with protein AND the omega-3s gym people pay for in pills.',
    recipe: '1 can sardines · Sliced onion soaked in lemon · Tomato, cucumber · 1 loaf bread · Black pepper + lemon over everything',
    boost: 'Eat the soft bones — free calcium.' },
  { id: 'fattehhummus', en: 'Fatteh hummus (light)', ar: 'فتة حمص', slot: ['l', 'b'], e: '🥛', kcal: 520, pro: 26, full: 5, cost: 1, mins: 20,
    why: 'Layers of toasted bread, warm chickpeas and garlicky yogurt — the baked-not-fried version.',
    recipe: 'Toast 1 torn loaf in the oven till crisp · Warm 2 cups chickpeas · Mix 2 cups laban + crushed garlic + pinch salt (+ 1 tbsp tahini if you have) · Layer bread, chickpeas, yogurt · Cumin + olive oil drizzle',
    boost: 'The laban layer is the protein — be generous with it, light with the oil.' },
  { id: 'burghulbanadoura', en: 'Burghul b banadoura', ar: 'برغل بالبندورة', slot: ['l', 'd'], e: '🌾', kcal: 500, pro: 16, full: 4, cost: 1, mins: 30,
    why: 'Burghul is whole grain — slower to digest than white rice, so you stay full longer.',
    recipe: 'Sauté 1 onion · Add 2 chopped tomatoes + 1 tbsp paste · Stir in 1 cup coarse burghul + 1½ cups water · Simmer covered 15 min · Rest 5 min',
    boost: 'Laban w khyar on the side — the classic pairing, and the protein fix.' },
  { id: 'mfaraket', en: 'Mfaraket batata w bayd', ar: 'مفركة بطاطا وبيض', slot: ['l', 'd'], e: '🥔', kcal: 480, pro: 20, full: 4, cost: 1, mins: 25,
    why: 'Potato and egg scramble — comfort food that actually fills you, oven-crisped not deep-fried.',
    recipe: 'Cube 2 potatoes, toss with 1 tbsp oil, roast or air-crisp till golden · Sauté 1 onion in a pan, add potatoes · Crack 3 eggs over, scramble through · Salt, pepper, sumac',
    boost: 'Add a side of laban or a spoon of labneh.' },
  { id: 'kafta', en: 'Baked kafta + salad', ar: 'كفتة بالفرن', slot: ['l'], e: '🍢', kcal: 520, pro: 34, full: 4, cost: 2, mins: 30,
    why: 'When minced meat appears, stretch it with parsley and onion and bake it.',
    recipe: 'Mix 400g minced meat + 1 grated onion + big bunch chopped parsley + salt + 7-spice · Shape flat fingers, bake 20 min with tomato slices · Serve with salad + 1 loaf bread',
    boost: 'Grate a potato into the mix — stretches it AND keeps it juicy.' },
  { id: 'cleanout', en: 'Clean-out pilaf + egg', ar: 'رز بالخضرة وبيض', slot: ['l', 'd'], e: '🍳', kcal: 480, pro: 18, full: 4, cost: 1, mins: 30,
    why: 'Whatever veg is left in the fridge becomes pilaf. The fried egg on top makes it a meal.',
    recipe: 'Sauté onion + any veg (carrot, zucchini, peas, pepper) · Add 1 cup rice or burghul + 1½ cups water + salt + turmeric · Simmer 15 min · Fried egg on top of every plate',
    boost: 'Two eggs each if it\'s dinner after a workout day.' },
  { id: 'adassalad', en: 'Warm lentil salad', ar: 'سلطة عدس', slot: ['l', 'd'], e: '🥙', kcal: 430, pro: 22, full: 4, cost: 1, mins: 25,
    why: 'Lentils dressed like tabbouleh — bright, cheap, and it holds you for hours.',
    recipe: 'Boil 1 cup lentils till just tender, drain · While warm, toss with chopped onion, tomato, parsley, mint · Lemon + 1 tbsp olive oil + salt + cumin',
    boost: 'Crumble white cheese over, or add a boiled egg.' },
  { id: 'hindbeh', en: 'Hindbeh b zeit', ar: 'هندبة بزيت', slot: ['l', 'd'], e: '🌿', kcal: 390, pro: 12, full: 4, cost: 1, mins: 30,
    why: 'Bitter greens with caramelized onions — iron, fiber, and that taste of teta\'s kitchen.',
    recipe: 'Boil chopped dandelion greens (or chard) 5 min, squeeze dry · Sauté in olive oil with 2 sliced caramelized onions · Lemon wedges · Bread + labneh side',
    boost: 'Low protein alone — the labneh side or 2 boiled eggs complete it.' },

  // ---- dinners (lighter) ----
  { id: 'fattoush', en: 'Big fattoush + eggs', ar: 'فتوش وبيض', slot: ['d'], e: '🥗', kcal: 390, pro: 17, full: 4, cost: 1, mins: 15,
    why: 'A huge bowl of crunch with baked bread chips — volume eating at its best.',
    recipe: 'Chop lettuce, cucumber, tomato, radish, mint, onion · Dress with lemon, 1 tbsp olive oil, sumac, pinch of salt · Oven-toast 1 loaf into chips (not fried) · Top with 2 boiled eggs',
    boost: 'The eggs are the difference between a side and a dinner. Don\'t skip them.' },
  { id: 'tabbouleh', en: 'Tabbouleh + labneh toast', ar: 'تبولة', slot: ['d'], e: '🌱', kcal: 380, pro: 13, full: 3, cost: 1, mins: 25,
    why: 'Parsley is the main event — light dinner for rest days.',
    recipe: 'Soak 3 tbsp fine burghul in lemon juice · Chop 2 bunches parsley + mint + tomato + onion very fine · Toss with the burghul, lemon, 1½ tbsp olive oil, salt · Labneh on toasted bread alongside',
    boost: 'The labneh toast carries the protein — 3 tbsp minimum.' },
  { id: 'labankhyar', en: 'Laban w khyar + rice', ar: 'لبن وخيار ورز', slot: ['d'], e: '🥛', kcal: 380, pro: 14, full: 4, cost: 1, mins: 10,
    why: 'Cold yogurt-cucumber over warm rice — the summer comfort classic, surprisingly filling.',
    recipe: 'Whisk 2 cups laban with grated cucumber, crushed garlic, dried mint, salt · Pour over 1 cup warm rice',
    boost: 'Use thick laban; add a boiled egg if you trained today.' },
  { id: 'hummusegg', en: 'Hummus + egg plate', ar: 'حمص وبيض', slot: ['d', 'b'], e: '🍽️', kcal: 450, pro: 23, full: 4, cost: 1, mins: 12,
    why: 'Warm hummus with a fried or boiled egg on top — the corner-restaurant special at home.',
    recipe: 'Blend 2 cups chickpeas + 2 tbsp tahini + lemon + garlic + cold water till creamy · Warm slightly · Egg on top, cumin + paprika, thread of olive oil · 1 loaf bread',
    boost: 'Two eggs, and eat with cucumber sticks instead of half the bread.' },
  { id: 'omeletwrap', en: 'Veg omelet wrap', ar: 'لفافة عجة', slot: ['d'], e: '🌯', kcal: 380, pro: 21, full: 4, cost: 1, mins: 10,
    why: 'A rolled dinner sandwich that\'s actually protein in disguise.',
    recipe: 'Whisk 2-3 eggs with chopped tomato, onion, parsley · Cook flat like a pancake · Roll inside 1 loaf with labneh smear + cucumber',
    boost: 'A slice of white cheese melted in while it cooks.' },
  { id: 'soupdinner', en: 'Lentil soup + labneh toast', ar: 'شوربة ولبنة', slot: ['d'], e: '🍜', kcal: 380, pro: 19, full: 4, cost: 1, mins: 20,
    why: 'Half portion of soup plus a serious labneh toast — light but complete.',
    recipe: 'A bowl of shorbet adas (make extra at lunch, reheat) · Toast bread, thick labneh, zaatar, cucumber slices · Lemon in the soup',
    boost: 'Make the toast a double-decker.' },
  { id: 'bigtunasalad', en: 'Big salad + tuna', ar: 'سلطة كبيرة وتونة', slot: ['d'], e: '🥬', kcal: 400, pro: 32, full: 4, cost: 2, mins: 10,
    why: 'The heaviest protein hitter of the light dinners. Eat the whole bowl.',
    recipe: 'A mountain of lettuce, cucumber, tomato, onion · 1 can tuna + ½ cup chickpeas · Lemon, olive oil, salt, mint',
    boost: 'Already maxed. Enjoy.' },
  { id: 'batatafurn', en: 'Oven fries night', ar: 'بطاطا بالفرن', slot: ['d'], e: '🍟', kcal: 430, pro: 14, full: 3, cost: 1, mins: 35,
    why: 'Craving fries? Make them. Oven-crisped with garlic labneh dip — same joy, half the oil.',
    recipe: 'Cut 3 potatoes into wedges · Toss with 1 tbsp oil, salt, paprika, zaatar · Bake hot (220°C) 30 min, flip once · Dip: labneh + crushed garlic + lemon',
    boost: 'Add a fried egg or grilled cheese slice on the side to make it a real dinner.' },
];

/* snack pool doubles as the Craving SOS arsenal */
const SNACKS = [
  { id: 'protein_shake', en: 'Pea protein shake', ar: 'شيك بروتين', type: 'sweet', e: '🥤', kcal: 110, pro: 20, note: '1 scoop + cold water or milk, shake hard, cinnamon on top. 20g protein for ~100 kcal — the craving killer with receipts.' },
  { id: 'protein_ice', en: 'Protein banana ice cream', ar: 'بوظة بروتين', type: 'sweet', e: '🍨', kcal: 220, pro: 21, note: 'Blend frozen banana chunks with 1 scoop pea protein + splash of milk. Actual dessert, 21g protein.' },
  { id: 'protein_pudding', en: 'Protein mhalabia', ar: 'مهلبية بالبروتين', type: 'sweet', e: '🍮', kcal: 170, pro: 13, note: 'Make mhalabia with xylitol instead of sugar, whisk in ½ scoop protein once it cools a bit. Batch 4 cups for the week.' },
  { id: 'dates_tahini', en: 'Dates + tahini', ar: 'تمر وطحينة', type: 'sweet', e: '🌰', kcal: 160, pro: 3, note: '3 dates, small drizzle of tahini. Tastes like halawa, acts like fuel.' },
  { id: 'laban_cin', en: 'Laban + banana + cinnamon', ar: 'لبن وموز', type: 'sweet', e: '🍌', kcal: 180, pro: 9, note: 'Cold, creamy, sweet — and 9g protein sneaks in.' },
  { id: 'banana_ice', en: 'Frozen banana whip', ar: 'موز مثلج', type: 'sweet', e: '🍦', kcal: 120, pro: 1, note: 'Freeze banana chunks, mash/blend till creamy. Basically ice cream.' },
  { id: 'rizbhaleeb', en: 'Riz b haleeb (light)', ar: 'رز بحليب', type: 'sweet', e: '🍚', kcal: 170, pro: 7, note: 'Small cup, made with milk + xylitol + rose water — sweet with zero sugar cost. Make 4 cups, keep them in the fridge.' },
  { id: 'debs_tahini', en: 'Debs w tahini', ar: 'دبس وطحينة', type: 'sweet', e: '🍯', kcal: 170, pro: 3, note: 'Carob molasses swirled with tahini, scooped with a bite of bread. The OG Lebanese dessert.' },
  { id: 'apple_cin', en: 'Apple + cinnamon', ar: 'تفاح وقرفة', type: 'sweet', e: '🍎', kcal: 90, pro: 0, note: 'Sliced, dusted with cinnamon. Microwave 1 min and it\'s basically apple pie filling.' },
  { id: 'hotmilk', en: 'Hot cinnamon milk', ar: 'حليب بالقرفة', type: 'sweet', e: '🥛', kcal: 120, pro: 8, note: 'Warm milk + cinnamon + xylitol. A dessert you drink. Stir in ½ scoop protein off the heat and it becomes a 18g-protein nightcap.' },
  { id: 'mhalabia', en: 'Mhalabia (light)', ar: 'مهلبية', type: 'sweet', e: '🥄', kcal: 140, pro: 6, note: 'Milk pudding with rose water, sweetened with xylitol. Batch it.' },
  { id: 'qdameh', en: 'Qdameh', ar: 'قضامة', type: 'savory', e: '🥜', kcal: 120, pro: 6, note: 'A handful of roasted chickpeas. Crunchy, cheap, and 6g protein.' },
  { id: 'popcorn', en: 'Zaatar popcorn', ar: 'فشار بالزعتر', type: 'savory', e: '🍿', kcal: 110, pro: 3, note: 'Pop kernels in a pot with 1 tsp oil, dust with zaatar + salt. A huge bowl, barely any calories.' },
  { id: 'cuc_labneh', en: 'Cucumber + labneh dip', ar: 'خيار ولبنة', type: 'savory', e: '🥒', kcal: 100, pro: 6, note: 'Cucumber spears in seasoned labneh. Cold and crunchy.' },
  { id: 'egg_zaatar', en: 'Boiled egg + zaatar', ar: 'بيضة وزعتر', type: 'savory', e: '🥚', kcal: 90, pro: 7, note: 'One boiled egg rolled in zaatar. Keep 4 boiled in the fridge, always.' },
  { id: 'pita_chips', en: 'Pita chips + laban dip', ar: 'خبز محمص ولبن', type: 'savory', e: '🫓', kcal: 150, pro: 6, note: 'Oven-toast half a loaf into chips, dip in garlicky laban.' },
  { id: 'olives_cheese', en: 'Olives + cheese bite', ar: 'زيتون وجبنة', type: 'savory', e: '🫒', kcal: 130, pro: 6, note: '6 olives, small piece of white cheese, cucumber. A tiny mezze.' },
  { id: 'roasted_hummus', en: 'Roasted spiced chickpeas', ar: 'حمص محمص', type: 'savory', e: '🔥', kcal: 140, pro: 7, note: 'Oven-roast cooked chickpeas with paprika + cumin till crunchy. Chips replacement.' },
  { id: 'balila_cup', en: 'Mini balila cup', ar: 'كاسة بليلة', type: 'savory', e: '🥣', kcal: 150, pro: 8, note: 'A small warm cup of chickpeas, cumin, lemon. Kills savory cravings dead.' },
];

const TIPS = [
  'Protein first: eat the eggs/beans/tuna part of your plate before the bread and rice. You\'ll fill up on the right stuff.',
  'A big glass of water before every meal. Half of what feels like hunger is thirst.',
  'The family pot strategy: take your portion, add YOUR protein (egg, laban, tuna) on top. You don\'t need a separate meal — just an upgrade.',
  'Portion the bread before you sit down. One loaf next to your plate beats a bag within reach.',
  'Craving sweets right after a meal? That fades in 10 minutes. Set a timer, drink water, then decide.',
  'Keep 4 boiled eggs in the fridge at all times. They\'ve saved more diets than any supplement.',
  'Qdameh in your pocket when you leave the house — the cheapest craving insurance there is.',
  'Don\'t drink your calories: soda and juice vanish in seconds and leave you hungrier. Water, tea, or laban ayran.',
  'Every staircase you see is free gym equipment. Two extra flights today is progress nobody can take from you.',
  'Eat slowly — your stomach needs ~20 minutes to tell your brain it\'s full. Race it and you lose.',
  'Weigh in once a week, same day, morning, after the bathroom. Daily weights lie; weekly trends tell the truth.',
  'Sleep is a fat-loss tool. Under 7 hours and your hunger hormones turn against you.',
  'A "bad" meal doesn\'t ruin anything — the next meal decides the week, not the last one.',
  'Laban w khyar is basically free protein soup. When in doubt, add it to any meal.',
  'Best times for your pea protein shake: right after a workout, or between meals when the family pot was low on protein. It\'s a top-up, not a meal replacement.',
  'Xylitol: 1 tablespoon is plenty, and go easy at first — big amounts can upset your stomach. And it\'s seriously toxic to dogs, so keep it away from any pets.',
  'A scoop of pea protein whisked into laban, mhalabia, or a shake is the cheapest 20g of protein you\'ll ever buy per serving. Use it daily.',
];

/* ================= data: exercises ================= */
const EX = {
  // strength
  pushup: { unit: 'reps', base: 8, inc: 1, variants: [
    { min: 1, name: 'Wall push-ups', tip: 'Hands on wall at chest height, body straight, chest to wall slowly.' },
    { min: 4, name: 'Knee push-ups', tip: 'Knees down, straight line knees-to-head, chest to floor.' },
    { min: 7, name: 'Push-ups', tip: 'Full plank, elbows at 45°, control the way down.' }] },
  squat: { unit: 'reps', base: 10, inc: 1, variants: [
    { min: 1, name: 'Chair squats', tip: 'Sit back to touch the chair, stand right back up. Knees track over toes.' },
    { min: 4, name: 'Bodyweight squats', tip: 'Hips back first, chest up, as deep as comfortable.' },
    { min: 8, name: 'Pause squats', tip: 'Hold 2 seconds at the bottom of every rep.' }] },
  bridge: { unit: 'reps', base: 12, inc: 1, variants: [
    { min: 1, name: 'Glute bridges', tip: 'On your back, feet flat, squeeze up till body is a straight line.' },
    { min: 7, name: 'Single-leg bridges', tip: 'One leg extended — half the reps per side.' }] },
  wallsit: { unit: 'sec', base: 20, inc: 5, name: 'Wall sit', tip: 'Back flat on wall, thighs parallel-ish to floor, breathe.' },
  lunge: { unit: 'reps', base: 6, inc: 1, perSide: true, variants: [
    { min: 1, name: 'Supported lunges', tip: 'Hold the wall or a chair, step back into a gentle lunge. Per leg.' },
    { min: 5, name: 'Reverse lunges', tip: 'Step back, knee toward floor, push through the front heel. Per leg.' }] },
  calf: { unit: 'reps', base: 15, inc: 2, name: 'Calf raises', tip: 'Rise slow, pause at the top, lower slower. Hold wall for balance.' },
  superman: { unit: 'reps', base: 10, inc: 1, name: 'Supermans', tip: 'On your belly, lift chest and legs, squeeze the lower back, 2s hold.' },
  dips: { unit: 'reps', base: 6, inc: 1, name: 'Chair dips', tip: 'Hands on chair edge, knees bent, small range. Shoulders down away from ears.' },
  // core
  plank: { unit: 'sec', base: 15, inc: 4, variants: [
    { min: 1, name: 'Knee plank', tip: 'Forearms down, knees down, straight line, don\'t hold your breath.' },
    { min: 5, name: 'Plank', tip: 'Forearms and toes, squeeze glutes, no sagging hips.' }] },
  sideplank: { unit: 'sec', base: 10, inc: 3, perSide: true, name: 'Knee side plank', tip: 'On forearm + knees, lift hips, straight line. Per side.' },
  birddog: { unit: 'reps', base: 8, inc: 1, perSide: true, name: 'Bird dogs', tip: 'On all fours, opposite arm + leg out, slow and balanced. Per side.' },
  deadbug: { unit: 'reps', base: 8, inc: 1, perSide: true, name: 'Dead bugs', tip: 'On your back, opposite arm + leg lower slowly, back stays flat. Per side.' },
  kneeraise: { unit: 'reps', base: 12, inc: 2, name: 'Standing knee raises', tip: 'Stand tall, drive knee to hip height, crunch the abs each rep.' },
  // cardio
  rope: { unit: 'sec', base: 25, inc: 5, needs: 'rope', name: 'Jump rope', tip: 'Land soft on the balls of your feet. Trip? Just keep the rhythm going.' },
  shadow: { unit: 'sec', base: 40, inc: 5, name: 'Shadow boxing', tip: 'Jab-cross-hook combos, light on your feet, exhale on every punch.' },
  jacks: { unit: 'reps', base: 15, inc: 2, variants: [
    { min: 1, name: 'Step jacks', tip: 'Step side-to-side with the arm swing — no jumping, same burn.' },
    { min: 6, name: 'Jumping jacks', tip: 'Land soft, knees slightly bent.' }] },
  highmarch: { unit: 'sec', base: 30, inc: 5, name: 'High-knee march', tip: 'March hard, knees to hip height, pump the arms.' },
  skater: { unit: 'reps', base: 12, inc: 2, name: 'Side-to-side skaters', tip: 'Step wide side to side, reach across the body. Low impact, big burn.' },
  buttkick: { unit: 'sec', base: 30, inc: 5, name: 'Butt-kick steps', tip: 'Heels to glutes, quick light steps.' },
  punchsquat: { unit: 'reps', base: 10, inc: 2, name: 'Squat + punch', tip: 'Squat down, stand and throw 2 punches. That\'s one rep.' },
  stepup: { unit: 'reps', base: 10, inc: 2, needs: 'stairs', perSide: true, name: 'Stair step-ups', tip: 'Bottom step, full foot on, drive through the heel. Per leg.' },
  stairclimb: { unit: 'reps', base: 3, inc: 1, needs: 'stairs', name: 'Stair climbs (flights)', tip: 'Up at a steady pace, walk down slow — downhill is the rest.' },
  walk: { unit: 'min', base: 10, inc: 1, name: 'Brisk walk', tip: 'Fast enough that talking takes effort, slow enough that you can.' },
  // warmup
  w_march: { unit: 'sec', base: 30, inc: 0, name: 'March in place', tip: 'Easy pace, swing the arms, wake the body up.' },
  w_circles: { unit: 'sec', base: 30, inc: 0, name: 'Arm circles + shoulder rolls', tip: 'Small circles growing bigger, both directions.' },
  w_twist: { unit: 'sec', base: 30, inc: 0, name: 'Torso twists', tip: 'Feet planted, rotate gently side to side.' },
  w_sidestep: { unit: 'sec', base: 30, inc: 0, name: 'Side steps + arm swings', tip: 'Step side to side, arms swing loose.' },
  w_hips: { unit: 'sec', base: 30, inc: 0, name: 'Hip circles', tip: 'Hands on hips, big slow circles both ways.' },
  w_slowsquat: { unit: 'sec', base: 30, inc: 0, name: 'Slow easy squats', tip: 'Half depth, just greasing the knees and hips.' },
  // cooldown
  c_quad: { unit: 'sec', base: 25, inc: 0, name: 'Quad stretch', tip: 'Heel to glute, knees together, hold the wall. Both legs.' },
  c_ham: { unit: 'sec', base: 25, inc: 0, name: 'Hamstring stretch', tip: 'Heel forward, hips back, flat back. Both legs.' },
  c_chest: { unit: 'sec', base: 25, inc: 0, name: 'Doorway chest stretch', tip: 'Forearm on the doorframe, lean gently through.' },
  c_child: { unit: 'sec', base: 30, inc: 0, name: 'Child\'s pose', tip: 'Knees wide, arms long, breathe into your back.' },
  c_catcow: { unit: 'sec', base: 30, inc: 0, name: 'Cat-cow', tip: 'On all fours, arch and round slowly with the breath.' },
  c_calf: { unit: 'sec', base: 25, inc: 0, name: 'Calf stretch', tip: 'Hands on wall, back leg straight, heel down. Both legs.' },
};
const CARDIO_IDS = ['rope', 'shadow', 'jacks', 'highmarch', 'skater', 'buttkick', 'punchsquat'];
const STR_IDS = ['pushup', 'squat', 'bridge', 'lunge', 'calf', 'superman', 'dips', 'wallsit'];
const CORE_IDS = ['plank', 'sideplank', 'birddog', 'deadbug', 'kneeraise'];
const WARM_IDS = ['w_march', 'w_circles', 'w_twist', 'w_sidestep', 'w_hips', 'w_slowsquat'];
const COOL_IDS = ['c_quad', 'c_ham', 'c_chest', 'c_child', 'c_catcow', 'c_calf'];

function exInfo(id, level) {
  const ex = EX[id];
  if (ex.variants) {
    let v = ex.variants[0];
    for (const vv of ex.variants) if (level >= vv.min) v = vv;
    return { name: v.name, tip: v.tip, unit: ex.unit, perSide: !!ex.perSide };
  }
  return { name: ex.name, tip: ex.tip, unit: ex.unit, perSide: !!ex.perSide };
}
function exAmt(id, level, scale = 1) {
  const ex = EX[id];
  let v = (ex.base + ex.inc * (level - 1)) * scale;
  if (ex.unit === 'sec') v = Math.max(10, Math.round(v / 5) * 5);
  else v = Math.max(3, Math.round(v));
  return v;
}
function fmtAmt(id, level, scale = 1) {
  const ex = EX[id]; const info = exInfo(id, level); const v = exAmt(id, level, scale);
  const u = ex.unit === 'sec' ? 's' : ex.unit === 'min' ? ' min' : '×';
  return (u === '×' ? `×${v}` : `${v}${u}`) + (info.perSide ? ' /side' : '');
}

/* ================= workout formats ================= */
function block(heading, sub, ids, level, scale = 1, rng = null, amounts = null) {
  return { heading, sub, items: ids.map((id, i) => {
    const info = exInfo(id, level);
    return { id, name: info.name, tip: info.tip, unit: EX[id].unit,
      secs: EX[id].unit === 'sec' ? (amounts ? amounts[i] : exAmt(id, level, scale)) : 0,
      amtText: amounts ? (EX[id].unit === 'sec' ? `${amounts[i]}s` : `×${amounts[i]}`) + (info.perSide ? ' /side' : '') : fmtAmt(id, level, scale) };
  }) };
}
function warmBlock(rng, level) { return block('Warm-up', 'ease in — don\'t skip', pickN(rng, WARM_IDS, 3), level); }
function coolBlock(rng, level) { return block('Cool-down', 'stretch it out, breathe', pickN(rng, COOL_IDS, 3), level); }

const FORMATS = [
  { id: 'circuit', name: 'Round Trip', desc: 'A circuit of 5 moves. Finish all 5, rest 60–90s, go again.',
    build(rng, lv, mins) {
      const rounds = mins >= 25 && lv >= 3 ? 3 : 2;
      const ids = [...pickN(rng, CARDIO_IDS, 2), ...pickN(rng, STR_IDS, 2), ...pickN(rng, CORE_IDS, 1)];
      return [block(`The circuit — ${rounds} rounds`, 'rest 60–90s between rounds', ids, lv)];
    } },
  { id: 'ladder', name: 'The Ladder', desc: 'Four moves. Start at the top rung, drop reps each round — it gets easier as you get tired.',
    build(rng, lv, mins) {
      const ids = pickN(rng, [...STR_IDS.filter(i => EX[i].unit === 'reps'), ...CARDIO_IDS.filter(i => EX[i].unit === 'reps'), ...CORE_IDS.filter(i => EX[i].unit === 'reps')], 4);
      const f = 1 + 0.05 * (lv - 1);
      const rungs = [12, 10, 8, 6, 4].map(r => Math.round(r * f));
      return [{ heading: `The ladder — ${rungs.join(' → ')}`, sub: 'all 4 moves at each rung, short rests', items: ids.map(id => {
        const info = exInfo(id, lv);
        return { id, name: info.name, tip: info.tip, unit: 'reps', secs: 0, amtText: rungs.join('·') + (info.perSide ? ' /side' : '') };
      }) }];
    } },
  { id: 'intervals', name: 'Push & Breathe', desc: '30 seconds on, 20 seconds easy. Cycle through 4 moves.',
    build(rng, lv, mins) {
      const ids = [...pickN(rng, CARDIO_IDS, 3), ...pickN(rng, STR_IDS, 1)];
      const cycles = Math.max(3, Math.min(6, Math.round((mins - 9) / 3.4)));
      return [{ heading: `${cycles} cycles — 30s work / 20s easy`, sub: 'march in place during the easy 20s', items: ids.map(id => { const info = exInfo(id, lv); return { id, name: info.name, tip: info.tip, unit: 'sec', secs: 30, amtText: '30s' }; }) }];
    } },
  { id: 'ropeflow', name: 'Rope Flow', desc: 'Your rope is the star: rope bouts with a strength move between each.',
    build(rng, lv, mins) {
      const strs = pickN(rng, STR_IDS, 3);
      const ropeS = exAmt('rope', lv);
      const rounds = mins >= 25 ? 6 : 5;
      return [{ heading: `${rounds} rounds`, sub: `each round: rope ${ropeS}s, then the next strength move, rest 30s`, items: [
        { id: 'rope', name: exInfo('rope', lv).name, tip: EX.rope.tip, unit: 'sec', secs: ropeS, amtText: `${ropeS}s × ${rounds}` },
        ...strs.map(id => { const info = exInfo(id, lv); return { id, name: info.name, tip: info.tip, unit: EX[id].unit, secs: EX[id].unit === 'sec' ? exAmt(id, lv) : 0, amtText: fmtAmt(id, lv) }; }),
      ] }];
    } },
  { id: 'stairday', name: 'Stair Power', desc: 'Take it to the stairwell — climbs, step-ups, and legs that will thank you later.',
    build(rng, lv, mins) {
      const rounds = mins >= 25 ? 3 : 2;
      return [block(`Stairwell circuit — ${rounds} rounds`, 'walk down slowly between climbs, that\'s your rest', ['stairclimb', 'stepup', 'calf', 'wallsit'], lv)];
    } },
  { id: 'luckydraw', name: 'Lucky Draw', desc: 'The app rolled your reps. Three draws, four moves — no two draws alike.',
    build(rng, lv, mins) {
      const ids = [...pickN(rng, CARDIO_IDS.filter(i => EX[i].unit === 'reps'), 2), ...pickN(rng, STR_IDS.filter(i => EX[i].unit === 'reps'), 1), ...pickN(rng, CORE_IDS.filter(i => EX[i].unit === 'reps'), 1)];
      const draws = [];
      for (let d = 1; d <= 3; d++) {
        draws.push({ heading: `Draw ${d}`, sub: d === 1 ? 'rest 45–60s after each draw' : '', items: ids.map(id => {
          const info = exInfo(id, lv); const v = Math.max(4, Math.round(exAmt(id, lv) * (0.7 + rng() * 0.6)));
          return { id, name: info.name, tip: info.tip, unit: 'reps', secs: 0, amtText: `×${v}` + (info.perSide ? ' /side' : '') };
        }) });
      }
      return draws;
    } },
  { id: 'walktone', name: 'Walk & Sculpt', desc: 'Recovery day: a brisk walk outside (or laps at home), then a short tone-up.',
    build(rng, lv, mins) {
      const walkMin = Math.max(10, mins - 12);
      return [
        { heading: 'The walk', sub: 'outside if you can — stairs on the way home count double', items: [
          { id: 'walk', name: 'Brisk walk', tip: EX.walk.tip, unit: 'min', secs: 0, amtText: `${walkMin} min` }] },
        block('The sculpt — 2 rounds', 'slow and controlled', [pickN(rng, STR_IDS, 1)[0], pickN(rng, CORE_IDS, 1)[0], 'bridge'], lv),
      ];
    } },
  { id: 'minutemachine', name: 'Minute Machine', desc: 'Every 90 seconds, do one set. Finish early = rest. The clock is the coach.',
    build(rng, lv, mins) {
      const a = pickN(rng, CARDIO_IDS, 1)[0]; const b = pickN(rng, STR_IDS, 1)[0]; const c = pickN(rng, CORE_IDS, 1)[0];
      const rounds = Math.max(8, Math.min(12, Math.round((mins - 8) / 1.5)));
      return [{ heading: `${rounds} rounds of 90 seconds`, sub: 'rotate A → B → C, one set at the start of every 90s', items: [a, b, c].map(id => {
        const info = exInfo(id, lv); return { id, name: info.name, tip: info.tip, unit: EX[id].unit,
          secs: EX[id].unit === 'sec' ? exAmt(id, lv, 0.8) : 0, amtText: fmtAmt(id, lv, 0.8) };
      }) }];
    } },
];

/* ================= state ================= */
const KEY = 'yalla-v1';
const DEFAULTS = {
  profile: { name: 'Mhammad', age: 21, heightCm: 180, sex: 'M', startKg: 115, goalKg: 85, startDate: localDate(), minutes: 25, daysPerWeek: 5 },
  weights: [],
  sessions: [],
  level: 1,
  ratingPts: [],
  water: { d: null, cups: 0 },
  mealPlan: { d: null, picks: {}, },
  recentMeals: [],
  workoutNonce: { d: null, n: 0 },
  sos: 0,
  seenWelcome: false,
};
let S;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); return Object.assign(structuredClone(DEFAULTS), s, { profile: Object.assign(structuredClone(DEFAULTS.profile), s.profile || {}) }); }
  } catch (e) { /* corrupted state falls back to defaults */ }
  return structuredClone(DEFAULTS);
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full/blocked */ } }

/* ================= nutrition ================= */
function currentKg() { return S.weights.length ? S.weights[S.weights.length - 1].kg : S.profile.startKg; }
function bmr() { const p = S.profile; return Math.round(10 * currentKg() + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'M' ? 5 : -161)); }
function kcalTarget() { return Math.max(1800, Math.round(bmr() * 1.4) - 700); }
function proteinTarget() { return Math.min(140, Math.max(105, Math.round(currentKg() * 1.1))); }
function bmi() { return currentKg() / Math.pow(S.profile.heightCm / 100, 2); }
function kgLost() { return Math.round((S.profile.startKg - currentKg()) * 10) / 10; }

/* ================= meal engine ================= */
function slotPool(sl) { return sl === 's' ? SNACKS : MEALS.filter(m => m.slot.includes(sl)); }
function pickForSlot(sl, rng, avoid) {
  const pool = slotPool(sl);
  let cands = pool.filter(m => !avoid.has(m.id));
  if (cands.length < 2) cands = pool;
  const weights = cands.map(m => m.full || 3);
  const tot = weights.reduce((a, b) => a + b, 0);
  let r = rng() * tot;
  for (let i = 0; i < cands.length; i++) { r -= weights[i]; if (r <= 0) return cands[i].id; }
  return cands[cands.length - 1].id;
}
function ensureMealPlan() {
  const d = localDate();
  if (S.mealPlan.d === d && S.mealPlan.picks.b) return;
  const rng = mulberry32(hashStr(d + 'meals'));
  const avoid = new Set(S.recentMeals);
  const picks = {};
  for (const sl of ['b', 'l', 'd', 's']) { picks[sl] = pickForSlot(sl, rng, avoid); avoid.add(picks[sl]); }
  S.mealPlan = { d, picks };
  S.recentMeals = [...S.recentMeals, picks.b, picks.l, picks.d].slice(-12);
  save();
}
function shuffleSlot(sl) {
  const cur = S.mealPlan.picks[sl];
  const avoid = new Set([...S.recentMeals, ...Object.values(S.mealPlan.picks)]);
  let id = pickForSlot(sl, mulberry32(Date.now() >>> 0), avoid);
  if (id === cur) id = pickForSlot(sl, mulberry32((Date.now() + 999) >>> 0), new Set([cur]));
  S.mealPlan.picks[sl] = id;
  if (sl !== 's') S.recentMeals = [...S.recentMeals, id].slice(-12);
  save(); renderToday(); renderMeals();
}
function mealById(id) { return MEALS.find(m => m.id === id) || SNACKS.find(m => m.id === id); }

/* ================= workout engine ================= */
function ensureWorkoutNonce() { const d = localDate(); if (S.workoutNonce.d !== d) S.workoutNonce = { d, n: 0 }; }
function genWorkout() {
  ensureWorkoutNonce();
  const d = localDate();
  const rng = mulberry32((hashStr(d + 'wk') ^ Math.imul(S.workoutNonce.n + 1, 2654435761)) >>> 0);
  const recent = S.sessions.slice(-2).map(s => s.format);
  let pool = FORMATS.filter(f => !recent.includes(f.id));
  if (!pool.length) pool = FORMATS;
  const f = pool[Math.floor(rng() * pool.length)];
  const blocks = [warmBlock(rng, S.level), ...f.build(rng, S.level, S.profile.minutes), coolBlock(rng, S.level)];
  return { formatId: f.id, formatName: f.name, desc: f.desc, blocks };
}
function sessionsThisWeek() {
  const now = new Date(); const day = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now); monday.setDate(now.getDate() - day);
  const mstr = localDate(monday);
  return S.sessions.filter(s => s.d >= mstr).length;
}
function doneToday() { return S.sessions.some(s => s.d === localDate()); }
function completeSession(rating) {
  const w = genWorkout();
  S.sessions.push({ d: localDate(), format: w.formatId, level: S.level, rating });
  const pts = { easy: 1, right: 0, hard: -1 }[rating] || 0;
  S.ratingPts = [...S.ratingPts, pts].slice(-4);
  const sum = S.ratingPts.reduce((a, b) => a + b, 0);
  let msg = '';
  if (sum >= 3 && S.level < 10) { S.level++; S.ratingPts = []; msg = `LEVEL UP — you're now Level ${S.level} 🔥 The workouts just got a little spicier.`; }
  else if (sum <= -2 && S.level > 1) { S.level--; S.ratingPts = []; msg = `Eased back to Level ${S.level}. Smart pacing beats burnout — this is how you last.`; }
  save(); closeModal(); renderAll();
  toast(msg || ['Session logged 💪', 'Done. Your future self says thanks.', 'That\'s one more brick in the wall 🧱', 'Sahtein to your muscles 💪'][Math.floor(Math.random() * 4)]);
}

/* ================= badges ================= */
function badgeList() {
  const lost = kgLost(); const cur = currentKg(); const n = S.sessions.length; const g = S.profile.goalKg;
  return [
    { e: '🏁', n: 'Day one', d: 'Started the journey', ok: true },
    { e: '💪', n: 'First sweat', d: 'Complete 1 workout', ok: n >= 1 },
    { e: '🔥', n: 'Ten timer', d: '10 workouts', ok: n >= 10 },
    { e: '⚙️', n: 'Machine', d: '25 workouts', ok: n >= 25 },
    { e: '🏆', n: 'Fifty club', d: '50 workouts', ok: n >= 50 },
    { e: '😤', n: 'Craving slayer', d: 'Beat 1 craving with SOS', ok: S.sos >= 1 },
    { e: '🧊', n: 'Ice cold', d: 'Beat 10 cravings', ok: S.sos >= 10 },
    { e: '📉', n: 'On the board', d: 'First 2 kg gone', ok: lost >= 2 },
    { e: '🚀', n: 'Five down', d: '−5 kg', ok: lost >= 5 },
    { e: '🎯', n: 'Under 110', d: 'Below 110 kg', ok: cur < 110 },
    { e: '⭐', n: 'Ten down', d: '−10 kg', ok: lost >= 10 },
    { e: '💚', n: 'Under 105', d: 'Below 105 kg', ok: cur < 105 },
    { e: '🎉', n: 'Double digits', d: 'Below 100 kg', ok: cur < 100 },
    { e: '🌿', n: 'New zone', d: 'BMI below 30', ok: bmi() < 30 },
    { e: '👑', n: 'Twenty down', d: '−20 kg', ok: lost >= 20 },
    { e: '🏅', n: 'The goal', d: `Reach ${g} kg`, ok: cur <= g },
  ];
}

/* ================= weight chart (SVG, single series) ================= */
function nextMilestoneKg() {
  const cur = currentKg();
  const stones = [110, 105, 100, 97, 95, 92, 90, 88, S.profile.goalKg].filter(v => v < cur);
  return stones.length ? Math.max(...stones) : null;
}
function chartSVG() {
  const W = 360, H = 190, padL = 34, padR = 14, padT = 14, padB = 24;
  const w = S.weights.length ? S.weights : [{ d: S.profile.startDate, kg: S.profile.startKg }];
  const stone = nextMilestoneKg();
  const kgs = w.map(p => p.kg);
  let lo = Math.min(...kgs, stone ?? Infinity) - 1;
  let hi = Math.max(...kgs) + 1;
  if (hi - lo < 4) { hi += 2; lo -= 2; }
  const d0 = w[0].d;
  const span = Math.max(daysBetween(d0, w[w.length - 1].d), 21);
  const X = dd => padL + (daysBetween(d0, dd) / span) * (W - padL - padR);
  const Y = kg => padT + (1 - (kg - lo) / (hi - lo)) * (H - padT - padB);
  const pts = w.map(p => `${X(p.d).toFixed(1)},${Y(p.kg).toFixed(1)}`);
  const gridLines = [];
  const step = (hi - lo) > 12 ? 5 : 2;
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    gridLines.push(`<line x1="${padL}" y1="${Y(v).toFixed(1)}" x2="${W - padR}" y2="${Y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1"/>` +
      `<text x="${padL - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--ink-3)" style="font-variant-numeric:tabular-nums">${v}</text>`);
  }
  const area = w.length > 1 ? `<path d="M${pts.join(' L')} L${X(w[w.length - 1].d).toFixed(1)},${Y(lo + 0.001).toFixed(1)} L${X(d0).toFixed(1)},${Y(lo + 0.001).toFixed(1)} Z" fill="var(--chart-fill)"/>` : '';
  const line = w.length > 1 ? `<path d="M${pts.join(' L')}" fill="none" stroke="var(--chart-line)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  const dots = w.map((p, i) => `<circle data-i="${i}" cx="${X(p.d).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="${i === w.length - 1 ? 5 : 3.5}" fill="var(--chart-line)" stroke="var(--surface)" stroke-width="2" style="cursor:pointer"/>`).join('');
  const goal = stone !== null ? `<line x1="${padL}" y1="${Y(stone).toFixed(1)}" x2="${W - padR}" y2="${Y(stone).toFixed(1)}" stroke="var(--chart-goal)" stroke-width="1.5" stroke-dasharray="5 4"/>` +
    `<text x="${W - padR}" y="${(Y(stone) - 5).toFixed(1)}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--chart-goal)">next stop ${stone} kg</text>` : '';
  const lastX = X(w[w.length - 1].d), lastY = Y(w[w.length - 1].kg);
  const anchorStart = lastX < W / 2;
  const lastLabel = `<text x="${(anchorStart ? lastX + 8 : Math.min(lastX, W - padR - 4)).toFixed(1)}" y="${(lastY - 10).toFixed(1)}" text-anchor="${anchorStart ? 'start' : 'end'}" font-size="11.5" font-weight="800" fill="var(--ink)" style="font-variant-numeric:tabular-nums">${w[w.length - 1].kg} kg</text>`;
  const xlabels = `<text x="${padL}" y="${H - 6}" font-size="10" fill="var(--ink-3)">${d0.slice(5)}</text><text x="${W - padR}" y="${H - 6}" text-anchor="end" font-size="10" fill="var(--ink-3)">${w[w.length - 1].d.slice(5)}</text>`;
  return `<svg id="wchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight over time">${gridLines.join('')}${goal}${area}${line}${dots}${lastLabel}${xlabels}</svg>`;
}

/* ================= UI: shell ================= */
const NAV_ICONS = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h14V9.5"/></svg>',
  meals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.5 1-1.5 1-3M13 7c0-1.5 1-1.5 1-3"/></svg>',
  move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5z"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
};
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
  document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  window.scrollTo({ top: 0 });
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800);
}
function openModal(html) { $('#modal').innerHTML = html; $('#modalback').hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal() { $('#modalback').hidden = true; document.body.style.overflow = ''; }

/* ================= UI: today ================= */
function fullDots(n) {
  let s = '<span class="fulldots">';
  for (let i = 1; i <= 5; i++) s += `<span class="${i <= n ? '' : 'off'}">●</span>`;
  return s + '</span>';
}
function slotLabel(sl) { return { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snack' }[sl]; }
function mealRow(sl, id) {
  const m = mealById(id); if (!m) return '';
  const kcal = m.kcal, pro = m.pro;
  return `<div class="mealrow" data-action="recipe" data-id="${m.id}">
    <div class="slot">${m.e}</div>
    <div class="info">
      <div class="tiny">${slotLabel(sl)}</div>
      <div class="name">${esc(m.en)} <span class="ar">${esc(m.ar)}</span></div>
      <div class="meta num"><span>~${kcal} kcal</span><span>${pro}g protein</span>${m.full ? fullDots(m.full) : ''}</div>
    </div>
    <button class="shufflebtn" data-action="shuffle" data-slot="${sl}" aria-label="Swap this meal" title="Swap">⟳</button>
  </div>`;
}
function renderToday() {
  ensureMealPlan();
  const p = S.mealPlan.picks;
  const cur = currentKg(); const lost = kgLost();
  const week = sessionsThisWeek();
  const dayN = daysBetween(S.profile.startDate, localDate()) + 1;
  const lastW = S.weights[S.weights.length - 1];
  const weighDue = !lastW || daysBetween(lastW.d, localDate()) >= 7;
  const tip = TIPS[(dayN - 1) % TIPS.length];
  const wt = water();
  const totalK = ['b', 'l', 'd', 's'].reduce((a, sl) => a + (mealById(p[sl])?.kcal || 0), 0);
  const totalP = ['b', 'l', 'd', 's'].reduce((a, sl) => a + (mealById(p[sl])?.pro || 0), 0);

  $('#tab-today').innerHTML = `
    <div class="card hero">
      <div class="tiny" style="letter-spacing:0.08em;text-transform:uppercase;font-weight:700">Day ${dayN} of the journey</div>
      <h2>Yalla, ${esc(S.profile.name)} 👊</h2>
      <p class="muted">${lost > 0 ? `<b class="num">−${lost} kg</b> so far. ` : ''}This week: <b class="num">${week}/${S.profile.daysPerWeek}</b> workouts. ${week >= S.profile.daysPerWeek ? 'Target smashed — anything more is bonus.' : ''}</p>
    </div>

    ${weighDue ? `<div class="card tight" style="border-color:var(--gold)">
      <h3>⚖️ Weekly weigh-in ${lastW ? 'is due' : '— let\'s set your starting point'}</h3>
      <p class="muted">Morning, after the bathroom, before breakfast — that's the honest number.</p>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input id="quickKg" type="number" step="0.1" min="40" max="250" inputmode="decimal" placeholder="${cur}" style="flex:1;background:var(--surface-2);border:1.5px solid var(--line);border-radius:10px;font:inherit;padding:9px 12px;color:var(--ink)">
        <button class="btn small" data-action="quickweigh">Log it</button>
      </div>
    </div>` : ''}

    <div class="eyebrow"><span>Today's plate</span><span class="linkish num">~${totalK} kcal · ${totalP}g protein</span></div>
    <div class="card tight">
      ${mealRow('b', p.b)}${mealRow('l', p.l)}${mealRow('d', p.d)}${mealRow('s', p.s)}
    </div>
    <p class="tiny" style="margin:2px 4px 0">Tap a meal for the recipe · ⟳ swaps it for something else. Target: ~${kcalTarget()} kcal, ${proteinTarget()}g protein.</p>
    ${kcalTarget() - totalK > 250 ? `<div class="callout gold" style="margin-top:10px"><b>You have ~${kcalTarget() - totalK} kcal of room.</b> These are base portions — at your size, go for bigger servings of lunch and dinner, add a laban side, fruit, or an extra loaf. The target is a budget, not a punishment. Eat until you're actually full.</div>` : ''}

    <div class="eyebrow"><span>Today's move</span></div>
    ${doneToday()
      ? `<div class="card"><h3>✅ Workout done today</h3><p class="muted">Recovery is where the muscle happens. Perfect window for your pea protein shake 🥤 — then see you tomorrow, or take a victory walk.</p></div>`
      : (() => { const w = genWorkout(); return `<div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>${w.formatName}</h3><span class="levelbadge">LV ${S.level}</span>
          </div>
          <p class="muted">${w.desc}</p>
          <button class="btn wide" data-action="gomove" style="margin-top:8px">Let's move → ~${S.profile.minutes} min</button>
        </div>`; })()}

    <div class="eyebrow"><span>Water</span><span class="linkish num">${wt.cups}/8 cups</span></div>
    <div class="card tight">
      <div class="cups">${Array.from({ length: 8 }, (_, i) => `<button class="cup ${i < wt.cups ? 'on' : ''}" data-action="cup" data-i="${i + 1}" aria-label="cup ${i + 1}">${i < wt.cups ? '💧' : ''}</button>`).join('')}</div>
    </div>

    <div class="eyebrow"><span>Your coach</span></div>
    <div class="card tight" data-action="coach" style="cursor:pointer">
      <div style="display:flex;align-items:center;gap:11px">
        <span class="coachavatar" style="width:42px;height:42px;font-size:22px">🧑‍🏫</span>
        <div style="flex:1">
          <h3 style="margin:0">Ask Coach</h3>
          <p class="tiny" style="margin:1px 0 0">Missing an ingredient? Scale stuck? Hungry? Instant answers from your real numbers.</p>
        </div>
        <span style="color:var(--ink-3)">›</span>
      </div>
    </div>

    <div class="callout" style="margin-top:16px"><b>Coach's tip:</b> ${tip}</div>
  `;
}
function water() { const d = localDate(); if (S.water.d !== d) { S.water = { d, cups: 0 }; save(); } return S.water; }

/* ================= UI: meals tab ================= */
let mealFilter = 'all';
function renderMeals() {
  ensureMealPlan();
  const filters = [
    ['all', 'All'], ['b', 'Breakfast'], ['l', 'Lunch'], ['d', 'Dinner'],
    ['filling', 'Keeps me full'], ['protein', 'High protein'], ['quick', '≤15 min'],
  ];
  let list = MEALS;
  if (mealFilter === 'b' || mealFilter === 'l' || mealFilter === 'd') list = MEALS.filter(m => m.slot.includes(mealFilter));
  else if (mealFilter === 'filling') list = MEALS.filter(m => m.full >= 5);
  else if (mealFilter === 'protein') list = [...MEALS].sort((a, b) => b.pro - a.pro).slice(0, 12);
  else if (mealFilter === 'quick') list = MEALS.filter(m => m.mins <= 15);

  $('#tab-meals').innerHTML = `
    <div class="card">
      <h2>The kitchen 🍽️</h2>
      <p class="muted">Every meal here comes from a normal Lebanese pantry — beans, grains, eggs, laban, a can of tuna. Filling first, tasty always, nothing fancy required.</p>
      <div class="statgrid three" style="margin-top:10px">
        <div class="stat accent"><div class="v num">${kcalTarget()}</div><div class="l">kcal / day</div></div>
        <div class="stat accent"><div class="v num">${proteinTarget()}<small>g</small></div><div class="l">protein / day</div></div>
        <div class="stat"><div class="v num">3+1</div><div class="l">meals + snack</div></div>
      </div>
    </div>
    <div class="eyebrow"><span>Browse meals</span><span class="linkish num">${list.length} dishes</span></div>
    <div class="chiprow">${filters.map(([k, l]) => `<button class="chip ${mealFilter === k ? 'on' : ''}" data-action="mealfilter" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="card tight">
      ${list.map(m => `<div class="mealrow" data-action="recipe" data-id="${m.id}">
        <div class="slot">${m.e}</div>
        <div class="info">
          <div class="name">${esc(m.en)} <span class="ar">${esc(m.ar)}</span></div>
          <div class="meta num"><span>~${m.kcal} kcal</span><span>${m.pro}g pro</span><span>${m.mins} min</span>${fullDots(m.full)}</div>
        </div>
        <span style="color:var(--ink-3)">›</span>
      </div>`).join('')}
    </div>
    <div class="eyebrow"><span>Snack & craving arsenal</span></div>
    <div class="card tight">
      ${SNACKS.map(s => `<div class="snackrow">
        <div class="e">${s.e}</div>
        <div class="sn">${esc(s.en)} <span class="ar" style="font-size:0.95em">${esc(s.ar)}</span><br><span class="tiny">${esc(s.note)} <span class="num">~${s.kcal} kcal · ${s.pro}g pro</span></span></div>
      </div>`).join('')}
    </div>
  `;
}
function recipeModal(id) {
  const m = mealById(id); if (!m) return;
  const isSnack = !m.recipe;
  openModal(`
    <div class="modalhead">
      <div><h2>${m.e} ${esc(m.en)} <span class="ar">${esc(m.ar)}</span></h2>
      <div class="tiny num">~${m.kcal} kcal · ${m.pro}g protein${m.mins ? ` · ${m.mins} min` : ''}${m.cost ? ` · ${'$'.repeat(m.cost)}` : ''}</div></div>
      <button class="closex" data-action="closemodal" aria-label="Close">✕</button>
    </div>
    ${m.full ? `<p class="muted">Fullness: ${fullDots(m.full)}</p>` : ''}
    ${m.why ? `<p>${esc(m.why)}</p>` : `<p>${esc(m.note || '')}</p>`}
    ${!isSnack ? `<h3 style="margin-top:14px">How to make it</h3>
    <ol class="steps">${m.recipe.split(' · ').map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    ${m.boost ? `<div class="callout"><b>💪 Protein boost:</b> ${esc(m.boost)}</div>` : ''}
  `);
}

/* ================= UI: move tab ================= */
function renderMove() {
  const week = sessionsThisWeek();
  const done = doneToday();
  const w = done ? null : genWorkout();
  const recent = S.sessions.slice(-5).reverse();
  $('#tab-move').innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2>Move 🏃</h2><span class="levelbadge">LEVEL ${S.level} / 10</span>
      </div>
      <p class="muted">No equipment, no gym — just you, a rope, some stairs, and a different workout every time. Rate each session honestly and the app adjusts the intensity for you.</p>
      <div class="pbar" style="margin-top:8px"><i style="width:${Math.min(100, week / S.profile.daysPerWeek * 100)}%"></i></div>
      <p class="tiny num" style="margin-top:4px">${week}/${S.profile.daysPerWeek} sessions this week</p>
    </div>
    ${done ? `<div class="card"><h3>✅ Today is in the books</h3><p class="muted">Muscle is built in recovery, not in the workout. Have your pea protein shake, stretch, hydrate, walk if you're restless — tomorrow we go again.</p></div>`
    : `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <h3>${w.formatName}</h3>
          <button class="btn ghost small" data-action="reshuffle">🎲 Different one</button>
        </div>
        <p class="muted">${w.desc}</p>
        ${w.blocks.map((b, bi) => `<div class="wblock">
          <div class="bh"><h3>${esc(b.heading)}</h3>${b.sub ? `<span class="tiny">${esc(b.sub)}</span>` : ''}</div>
          ${b.items.map((it, ii) => `<div class="witem" data-w="${bi}-${ii}">
            <input type="checkbox" data-action="checkitem" aria-label="done ${esc(it.name)}">
            <div class="wn">${esc(it.name)}<span class="tip">${esc(it.tip)}</span></div>
            <span class="amt num">${esc(it.amtText)}</span>
            ${it.secs ? `<button class="timerbtn" data-action="timer" data-secs="${it.secs}">▶ ${it.secs}s</button>` : ''}
          </div>`).join('')}
        </div>`).join('')}
        <button class="btn wide" data-action="finish" style="margin-top:14px">Finish workout ✔</button>
      </div>`}
    <div class="eyebrow"><span>Recent sessions</span><span class="linkish num">${S.sessions.length} total</span></div>
    <div class="card tight">
      ${recent.length ? recent.map(s => {
        const f = FORMATS.find(x => x.id === s.format);
        const r = { easy: '😎 easy', right: '👍 just right', hard: '😮‍💨 tough' }[s.rating] || '';
        return `<div class="witem"><div class="wn">${f ? f.name : s.format}<span class="tip num">${s.d} · Level ${s.level}</span></div><span class="tiny">${r}</span></div>`;
      }).join('') : '<p class="muted" style="padding:6px 2px">No sessions yet. Today is a perfect day for the first one.</p>'}
    </div>
  `;
}
function finishModal() {
  openModal(`
    <div class="modalhead"><h2>How did it feel?</h2><button class="closex" data-action="closemodal" aria-label="Close">✕</button></div>
    <p class="muted">Answer honestly — this is how the app decides when to level you up or ease off.</p>
    <div class="raterow">
      <button class="ratebtn" data-action="rate" data-r="easy"><span class="e">😎</span><span class="t">Too easy</span></button>
      <button class="ratebtn" data-action="rate" data-r="right"><span class="e">👍</span><span class="t">Just right</span></button>
      <button class="ratebtn" data-action="rate" data-r="hard"><span class="e">😮‍💨</span><span class="t">Too hard</span></button>
    </div>
  `);
}

/* ---- countdown timer ---- */
let timerHandle = null;
function startCountdown(secs) {
  stopCountdown();
  const el = document.createElement('div');
  el.className = 'countdown'; el.id = 'countdown';
  el.innerHTML = `<span class="t num">${secs}</span><button data-action="stoptimer">stop</button>`;
  document.body.appendChild(el);
  let left = secs;
  timerHandle = setInterval(() => {
    left--;
    const t = el.querySelector('.t');
    if (t) t.textContent = left;
    if (left <= 0) {
      stopCountdown();
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      toast('⏱️ Time! Nice work.');
    }
  }, 1000);
}
function stopCountdown() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
  const el = $('#countdown'); if (el) el.remove();
}

/* ================= UI: progress tab ================= */
function renderProgress() {
  const cur = currentKg(); const lost = kgLost(); const toGo = Math.max(0, Math.round((cur - S.profile.goalKg) * 10) / 10);
  const b = bmi();
  const lastW = S.weights[S.weights.length - 1];
  const badges = badgeList(); const earned = badges.filter(x => x.ok).length;
  // weekly pace from last 2 weigh-ins ≥ 5 days apart
  let pace = null;
  if (S.weights.length >= 2) {
    const a = S.weights[S.weights.length - 1], z = S.weights[0];
    const days = daysBetween(z.d, a.d);
    if (days >= 5) pace = Math.round(((z.kg - a.kg) / days) * 7 * 10) / 10;
  }
  $('#tab-progress').innerHTML = `
    <div class="card">
      <h2>Progress 📈</h2>
      <div class="statgrid" style="margin-top:10px">
        <div class="stat accent"><div class="v num">${cur}<small> kg</small></div><div class="l">current</div></div>
        <div class="stat gold"><div class="v num">${lost > 0 ? '−' + lost : '0'}<small> kg</small></div><div class="l">lost so far</div></div>
        <div class="stat"><div class="v num">${toGo}<small> kg</small></div><div class="l">to goal (${S.profile.goalKg})</div></div>
        <div class="stat"><div class="v num">${b.toFixed(1)}</div><div class="l">BMI</div></div>
      </div>
      ${pace !== null ? `<p class="tiny num" style="margin-top:8px">Pace: ${pace > 0 ? '−' + pace : pace === 0 ? '0' : '+' + Math.abs(pace)} kg/week average${pace > 1.2 ? ' — a bit fast, make sure you\'re eating enough.' : pace > 0 ? ' — right in the healthy zone. Keep going.' : ''}</p>` : ''}
    </div>
    <div class="eyebrow"><span>Weight</span><span class="linkish num">${S.weights.length} weigh-in${S.weights.length === 1 ? '' : 's'}</span></div>
    <div class="card">
      <div class="chartwrap">${chartSVG()}</div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <input id="kgInput" type="number" step="0.1" min="40" max="250" inputmode="decimal" placeholder="${cur} kg" style="flex:1;background:var(--surface-2);border:1.5px solid var(--line);border-radius:10px;font:inherit;padding:9px 12px;color:var(--ink)">
        <button class="btn small" data-action="logweight">Log weigh-in</button>
      </div>
      <p class="tiny" style="margin-top:6px">${lastW ? `Last: ${lastW.kg} kg on ${lastW.d}.` : 'No weigh-ins yet — log your starting weight.'} Weekly, same day, same conditions.</p>
    </div>
    <div class="eyebrow"><span>Milestones</span><span class="linkish num">${earned}/${badges.length}</span></div>
    <div class="mgrid">
      ${badges.map(x => `<div class="mcell ${x.ok ? 'earned' : ''}" title="${esc(x.d)}"><div class="e">${x.e}</div><div class="n">${esc(x.n)}</div></div>`).join('')}
    </div>
    <div class="eyebrow" style="margin-top:18px"><span>Training</span></div>
    <div class="statgrid three">
      <div class="stat"><div class="v num">${S.sessions.length}</div><div class="l">workouts</div></div>
      <div class="stat"><div class="v num">${sessionsThisWeek()}</div><div class="l">this week</div></div>
      <div class="stat accent"><div class="v num">${S.level}</div><div class="l">level</div></div>
    </div>
  `;
}
function logWeightVal(v) {
  const kg = parseFloat(v);
  if (!kg || kg < 40 || kg > 250) { toast('Enter a weight between 40 and 250 kg'); return; }
  const d = localDate();
  const prev = currentKg();
  const i = S.weights.findIndex(x => x.d === d);
  if (i >= 0) S.weights[i].kg = kg; else S.weights.push({ d, kg });
  S.weights.sort((a, b) => a.d < b.d ? -1 : 1);
  save(); renderAll();
  if (kg < prev) toast(`−${Math.round((prev - kg) * 10) / 10} kg since last time. It's working 📉🔥`);
  else if (kg > prev) toast('Up a bit — totally normal, water and salt swing daily. The weekly trend is what counts.');
  else toast('Holding steady. Consistency first, the drop follows.');
}

/* ================= UI: SOS ================= */
function sosModal() {
  openModal(`
    <div class="modalhead"><h2>😤 Craving SOS</h2><button class="closex" data-action="closemodal" aria-label="Close">✕</button></div>
    <p>You're circling the kitchen. Been there. First, the ritual:</p>
    <ol class="steps">
      <li>Drink a full glass of water. Now, not after.</li>
      <li>Ask: am I hungry, or just bored? (Bored = go do 10 squats or step outside.)</li>
      <li>Still hungry after 10 minutes? Then eat — but eat from this list, not the cupboard.</li>
    </ol>
    <p style="margin-top:12px"><b>What are you craving?</b></p>
    <div class="sospick">
      <button class="btn gold" data-action="sostype" data-t="sweet">🍬 Something sweet</button>
      <button class="btn soft" data-action="sostype" data-t="savory">🧂 Something savory</button>
    </div>
    <div id="sosresults"></div>
  `);
}
function sosResults(type) {
  const pool = SNACKS.filter(s => s.type === type);
  const rng = mulberry32(Date.now() >>> 0);
  const picks = pickN(rng, pool, 3);
  $('#sosresults').innerHTML = `
    ${picks.map(s => `<div class="snackrow">
      <div class="e">${s.e}</div>
      <div class="sn">${esc(s.en)} <span class="ar" style="font-size:0.95em">${esc(s.ar)}</span><br><span class="tiny">${esc(s.note)} <span class="num">~${s.kcal} kcal</span></span></div>
    </div>`).join('')}
    <button class="btn sumac wide" data-action="soswin" style="margin-top:12px">That worked — craving beaten 💪</button>
  `;
}

/* ================= UI: settings ================= */
function settingsModal() {
  const p = S.profile;
  openModal(`
    <div class="modalhead"><h2>Settings</h2><button class="closex" data-action="closemodal" aria-label="Close">✕</button></div>
    <div class="field"><label for="setName">Name</label><input id="setName" value="${esc(p.name)}"></div>
    <div class="fieldrow">
      <div class="field"><label for="setAge">Age</label><input id="setAge" type="number" value="${p.age}" min="14" max="90"></div>
      <div class="field"><label for="setH">Height (cm)</label><input id="setH" type="number" value="${p.heightCm}" min="120" max="230"></div>
    </div>
    <div class="fieldrow">
      <div class="field"><label for="setGoal">Goal weight (kg)</label><input id="setGoal" type="number" value="${p.goalKg}" min="50" max="200"></div>
      <div class="field"><label for="setDays">Workout days/week</label><input id="setDays" type="number" value="${p.daysPerWeek}" min="2" max="7"></div>
    </div>
    <div class="field"><label for="setMins">Minutes per workout</label>
      <select id="setMins">
        ${[15, 20, 25, 30, 40].map(v => `<option value="${v}" ${p.minutes === v ? 'selected' : ''}>${v} minutes</option>`).join('')}
      </select>
    </div>
    <button class="btn wide" data-action="savesettings">Save</button>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn ghost small" data-action="exportdata" style="flex:1">⬇ Backup data</button>
      <button class="btn ghost small" data-action="importdata" style="flex:1">⬆ Restore</button>
    </div>
    <input id="importfile" type="file" accept="application/json" hidden>
    <p class="tiny" style="margin-top:10px">Your data lives only on this device. Back it up now and then — if the browser data is cleared, the backup file brings everything back.</p>
    <button class="btn small" data-action="resetdata" style="margin-top:12px;background:var(--sumac)">Reset everything</button>
  `);
}
function saveSettings() {
  const p = S.profile;
  p.name = $('#setName').value.trim() || p.name;
  p.age = parseInt($('#setAge').value) || p.age;
  p.heightCm = parseInt($('#setH').value) || p.heightCm;
  p.goalKg = parseFloat($('#setGoal').value) || p.goalKg;
  p.daysPerWeek = Math.min(7, Math.max(2, parseInt($('#setDays').value) || p.daysPerWeek));
  p.minutes = parseInt($('#setMins').value) || p.minutes;
  save(); closeModal(); renderAll(); toast('Saved ✔');
}
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `yalla-backup-${localDate()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ================= welcome ================= */
function renderWelcome() {
  if (S.seenWelcome) { $('#welcome').hidden = true; return; }
  $('#welcome').hidden = false;
  $('#welcome').innerHTML = `<div class="welcomecard">
    <div class="big">🌱</div>
    <h2>Ahla ${esc(S.profile.name)}!</h2>
    <p class="muted">This app was built for exactly one person: you. Lebanese kitchen meals that actually fill you up, workouts that never repeat, and a plan that adjusts as you get stronger.</p>
    <div class="statgrid three" style="margin:16px 0;text-align:left">
      <div class="stat"><div class="v num">${S.profile.startKg}</div><div class="l">start kg</div></div>
      <div class="stat accent"><div class="v num">${S.profile.goalKg}</div><div class="l">goal kg</div></div>
      <div class="stat gold"><div class="v num">${kcalTarget()}</div><div class="l">kcal/day</div></div>
    </div>
    <p class="muted">Toned, strong, healthy — no Greek-statue nonsense, no starving, no gym fees. One day at a time.</p>
    <button class="btn wide" data-action="startjourney" style="margin-top:10px">Yalla, let's start 🚀</button>
  </div>`;
}

/* ================= coach ================= */
const SUBS = [
  { miss: ['tahini', 'طحينة'], use: 'Peanut butter thinned with lemon works in dips; in msabbaha/hummus just skip it and add an extra spoon of olive oil + more lemon.' },
  { miss: ['laban', 'yogurt', 'لبن'], use: 'Mix milk with a squeeze of lemon and let it sit 10 min for cooking uses. For protein, swap in a boiled egg instead.' },
  { miss: ['labneh', 'لبنة'], use: 'Strain laban through a cloth or fine sieve for 2 hours — homemade labneh. Or use thick yogurt as-is.' },
  { miss: ['chickpea', 'hummus', 'حمص'], use: 'White beans or lentils do the same job in balila, msabbaha, and salads — same protein family.' },
  { miss: ['lentil', 'عدس'], use: 'Any bean works: white beans, fava, or split peas. Mujadara with white beans is real and delicious.' },
  { miss: ['bulgur', 'burghul', 'برغل'], use: 'Rice, one-to-one. For tabbouleh, soaked fine couscous or just extra parsley.' },
  { miss: ['rice', 'رز'], use: 'Bulgur (slightly less water) or cubed boiled potato. Bulgur is actually the upgrade — more fiber.' },
  { miss: ['tuna', 'تونة'], use: 'A can of sardines, or 2-3 boiled eggs — roughly the same protein. Sardines bring bonus omega-3s.' },
  { miss: ['chicken', 'دجاج'], use: 'Double the legumes and add an egg, or use canned tuna. The stew/rice recipes work the same.' },
  { miss: ['tomato', 'بندورة'], use: '1 tbsp tomato paste + ½ cup water replaces 2 fresh tomatoes in any cooked dish.' },
  { miss: ['lemon', 'حامض', 'ليمون'], use: 'White vinegar at half the amount. In salads, sumac + a little vinegar gets you close.' },
  { miss: ['parsley', 'بقدونس'], use: 'Cilantro, mint, or a mix. Ejjeh and tabbouleh survive the swap fine.' },
  { miss: ['mint', 'نعنع'], use: 'A pinch of dried zaatar or extra parsley.' },
  { miss: ['garlic', 'توم'], use: 'Extra onion cooked longer, or a pinch of garlic powder if it exists in the house.' },
  { miss: ['olive oil', 'زيت'], use: 'Any vegetable oil does the cooking job — olive oil is flavor, not magic. Use a bit less.' },
  { miss: ['egg', 'بيض'], use: 'For protein: extra legumes + laban, or your pea protein shake on the side. For binding ejjeh: 2 tbsp flour + water.' },
  { miss: ['sugar', 'سكر'], use: 'Your xylitol, one-to-one but start with less — or dates/debs for warm desserts.' },
  { miss: ['protein powder', 'protein', 'بروتين'], use: 'Out of powder? 2 boiled eggs or a can of tuna ≈ one scoop\'s protein. Laban is the budget backup.' },
  { miss: ['pine nuts', 'صنوبر'], use: 'Toasted crushed qdameh, or skip — they\'re decoration with a luxury price tag.' },
  { miss: ['zaatar', 'زعتر'], use: 'Dried thyme/oregano + sesame + sumac if you have them; or just sumac + salt.' },
];
function coachStats() {
  const cur = currentKg(), lost = kgLost(), week = sessionsThisWeek();
  let pace = null;
  if (S.weights.length >= 2) {
    const a = S.weights[S.weights.length - 1], z = S.weights[0];
    const days = daysBetween(z.d, a.d);
    if (days >= 5) pace = Math.round(((z.kg - a.kg) / days) * 7 * 10) / 10;
  }
  return { cur, lost, week, pace };
}
function coachAnswer(q) {
  const t = q.toLowerCase();
  const { cur, lost, week, pace } = coachStats();
  // ingredient substitutions first — "no tahini", "ma fi laban", "ran out of eggs"
  for (const s of SUBS) {
    if (s.miss.some(m => t.includes(m))) {
      return `<b>Missing ${esc(s.miss[0])}?</b> ${esc(s.use)}<br><span class="tiny">Ask me another ingredient, or tap a chip below.</span>`;
    }
  }
  if (/(on track|going well|progress|how am i|doing good)/.test(t)) {
    if (pace === null) return `Too early for a verdict — I need at least two weigh-ins a few days apart. So far: <span class="num">${week}/${S.profile.daysPerWeek}</span> workouts this week and the plan is live. Log your weigh-in weekly and I'll give you the honest numbers.`;
    if (pace >= 0.4 && pace <= 1.2) return `Yes. You're losing <span class="num">${pace} kg/week</span> — that's the textbook healthy zone. Total so far: <span class="num">−${lost} kg</span>, currently <span class="num">${cur} kg</span>. Workouts this week: <span class="num">${week}/${S.profile.daysPerWeek}</span>. Keep doing exactly this.`;
    if (pace > 1.2) return `You're dropping <span class="num">${pace} kg/week</span> — faster than ideal. Some of that is water weight early on (normal), but make sure you're actually eating your ~<span class="num">${kcalTarget()}</span> kcal. Losing too fast costs muscle, and muscle is the "toned" part of your goal.`;
    if (pace > 0) return `Moving at <span class="num">${pace} kg/week</span> — slow but real. If two more weeks stay this slow: tighten the pours of olive oil, count the bread loaves, and keep protein at <span class="num">${proteinTarget()}g</span>. Small leaks sink slow ships.`;
    return `The scale says <span class="num">${pace <= 0 ? '+' + Math.abs(pace) : pace} kg/week</span> right now. Before panicking: weigh same day, same morning conditions, and give it 2 full weeks — water swings hide real progress. If it's still flat then, we cut ~200 kcal (one loaf of bread) and add 10 min of walking.`;
  }
  if (/(plateau|stuck|not losing|scale.*(same|stuck|not moving))/.test(t)) {
    return `Plateaus are normal and they lie. Checklist: (1) weigh only weekly, same conditions; (2) recount the invisible calories — oil pours, bread count, sugary drinks; (3) protein at <span class="num">${proteinTarget()}g</span> so you're not hungry-snacking; (4) hold steady 2 more weeks. Still stuck? Drop ~200 kcal or add a daily 15-min walk. Never both at once.`;
  }
  if (/(hungry|starving|not full|جوعان)/.test(t)) {
    return `Hunger means the plan needs adjusting, not more willpower. In order: drink water first · make lunch/dinner portions BIGGER (you have calorie room — check the gold box on Today) · protein + fiber at every meal (that's why I keep pushing laban, eggs, and beans) · soup or salad starter adds volume for nothing. You should end meals full. If you don't, tell me which meal and I'll point you to a more filling swap.`;
  }
  if (/(protein|بروتين).*(today|hit|enough|how)|how.*protein/.test(t)) {
    ensureMealPlan();
    const totalP = ['b', 'l', 'd', 's'].reduce((a, sl) => a + (mealById(S.mealPlan.picks[sl])?.pro || 0), 0);
    const gap = proteinTarget() - totalP;
    return gap > 5
      ? `Today's plate covers ~<span class="num">${totalP}g</span> of your <span class="num">${proteinTarget()}g</span> target — <span class="num">${gap}g</span> to go. Fastest closers: pea protein shake (+20g), 2 boiled eggs (+13g), a cup of laban (+8g), can of tuna (+25g). One shake plus one egg basically closes it.`
      : `Today's plate already lands ~<span class="num">${totalP}g</span> vs a <span class="num">${proteinTarget()}g</span> target — you're covered. Eat the plan, take the shake if you trained.`;
  }
  if (/(missed|skip|lazy|didn'?t (work ?out|train)|no time)/.test(t)) {
    return `One missed workout costs you nothing — quitting over guilt costs everything. You're at <span class="num">${week}/${S.profile.daysPerWeek}</span> this week. The rule: never miss twice in a row. If today's session feels too big, do 10 minutes — the 🎲 button can deal you a Walk & Sculpt. Ten minutes keeps the identity: you're someone who shows up.`;
  }
  if (/(sore|hurt|pain|ache|وجع)/.test(t)) {
    return `Sore muscles a day or two after training = normal, it fades as you adapt. Move gently (walk, stretch), hydrate, sleep. <b>But sharp pain, joint pain, or pain during a movement is different</b> — stop that exercise, use the easier variation, and if it persists, see a doctor. Never train through sharp pain. I'm a coach, not a clinic.`;
  }
  if (/(sweet|craving|sugar|chocolate|حلو)/.test(t)) {
    return `That's what the 😤 SOS button lives for — hit it next time the kitchen starts calling. Your xylitol also unlocked the dessert menu: protein mhalabia, riz b haleeb, protein banana ice cream. Batch one tonight so the freezer answers before the cupboard does.`;
  }
  if (/(cheat|treat|ramadan|invited|wedding|party|عزيمة)/.test(t)) {
    return `Life happens — weddings, family tables, knefe exists. The move: eat light earlier that day, protein first at the event, enjoy the thing without seconds, and go for a walk after. One big meal never broke a plan; five days of "whatever, I already ruined it" does. Next morning: back to the plan, no punishment workouts.`;
  }
  if (/(water|hydrat)/.test(t)) {
    const w = water();
    return `You're at <span class="num">${w.cups}/8</span> cups today. Water before meals kills half of fake hunger, and at your training load you sweat more than you think. Fill a bottle in the morning and finish it by night — the cups on Today are there to tap.`;
  }
  if (/(sleep|tired|energy|نوم)/.test(t)) {
    return `Under 7 hours of sleep and your hunger hormones (ghrelin up, leptin down) literally argue for the cupboard. Aim 7-9h, keep the phone away the last 30 min, and if energy is low, check: did you eat enough today? Did you sleep? Fix those before blaming the plan.`;
  }
  return null; // no local answer — offer the AI briefing path
}
function coachBriefing(q) {
  const { cur, lost, week, pace } = coachStats();
  const recentW = S.weights.slice(-8).map(w => `${w.d}: ${w.kg}kg`).join(', ');
  return `You are my personal fitness coach and dietitian. Here is my live data from my tracking app:
- Mhammad, 21, male, 180 cm. Started ${S.profile.startKg} kg on ${S.profile.startDate}; now ${cur} kg (${lost > 0 ? 'lost ' + lost + ' kg' : 'just started'}). Goal: ${S.profile.goalKg} kg — toned and healthy, not bodybuilder-big.
- BMI ${bmi().toFixed(1)}. Daily targets: ~${kcalTarget()} kcal, ~${proteinTarget()}g protein.
- Weigh-ins: ${recentW || 'none yet'}${pace !== null ? ` (pace ~${pace} kg/week)` : ''}.
- Training: ${S.sessions.length} home workouts total, ${week}/${S.profile.daysPerWeek} this week, level ${S.level}/10. No equipment except a jump rope and stairs; low-impact only, no running yet; sessions ~${S.profile.minutes} min.
- Food reality: low-income Lebanese household. Meals come from beans, lentils, chickpeas, bulgur, rice, bread, potatoes, eggs, laban/labneh, white cheese, canned tuna/sardines, seasonal vegetables, olive oil, tahini. I also have pea protein powder (20g protein/scoop) and xylitol sweetener. No supplements budget beyond that.
- Tendencies: big appetite, sweet and savory cravings when meals don't fill me, I get bored with repetitive workouts.

My question: ${q}

Please answer specifically for MY situation and budget — no generic advice that assumes money, a gym, or ingredients I don't have.`;
}
let coachQ = '';
function coachModal() {
  openModal(`
    <div class="modalhead"><h2><span class="coachavatar">🧑‍🏫</span>Coach</h2><button class="closex" data-action="closemodal" aria-label="Close">✕</button></div>
    <div class="chatlog" id="chatlog">
      <div class="bubble coach">Ahla! Ask me anything — a missing ingredient ("no tahini"), whether you're on track, how to hit your protein, cravings, soreness. I answer instantly using your real numbers.</div>
    </div>
    <div class="coachchips">
      ${['Am I on track?', 'How do I hit my protein today?', "I'm missing an ingredient", "I'm hungry all the time", 'The scale is stuck', 'I missed a workout', 'Muscles are sore'].map(c => `<button class="chip" data-action="coachchip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}
    </div>
    <div class="coachinput">
      <input id="coachText" placeholder="Type your question…" autocomplete="off">
      <button class="btn small" data-action="coachsend">Send</button>
    </div>
    <p class="tiny" style="margin-top:10px">Deeper question? I'll package your full profile + progress with it — <b>Copy for AI</b> below puts a complete coach briefing on your clipboard, then paste it to Claude (free) for a real AI answer that knows you.</p>
    <div style="display:flex;gap:8px;margin-top:6px">
      <button class="btn ghost small" data-action="coachcopy" style="flex:1">📋 Copy for AI</button>
      <a class="btn soft small" style="flex:1;text-decoration:none" href="https://claude.ai/new" target="_blank" rel="noopener">Open Claude ↗</a>
    </div>
  `);
}
function coachSay(html, me = false) {
  const log = $('#chatlog'); if (!log) return;
  const b = document.createElement('div');
  b.className = 'bubble ' + (me ? 'me' : 'coach');
  b.innerHTML = html;
  log.appendChild(b);
  b.scrollIntoView({ block: 'nearest' });
}
function coachAsk(q) {
  if (!q.trim()) return;
  coachQ = q.trim();
  coachSay(esc(coachQ), true);
  const a = coachAnswer(coachQ);
  setTimeout(() => {
    if (a) coachSay(a);
    else if (/(missing|ingredient|substitute|swap|بدل)/i.test(coachQ)) coachSay('Tell me which ingredient is missing — like <i>"no tahini"</i> or <i>"ran out of eggs"</i> — and I\'ll give you the swap.');
    else coachSay(`That one deserves a real AI brain, not my quick answers. Tap <b>📋 Copy for AI</b> — I've packed your question together with your full profile and progress — then paste it into Claude (free at claude.ai). The answer will be personal to you, not generic.`);
  }, 350);
  const inp = $('#coachText'); if (inp) inp.value = '';
}
function coachCopy() {
  const q = coachQ || 'Give me an honest check-up on my progress and what to focus on next week.';
  const text = coachBriefing(q);
  const done = () => toast('Briefing copied — paste it to Claude 📋');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed — long-press the text to copy manually.'); }
  ta.remove();
}

/* ================= events ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) {
    // chart dot tooltips
    const dot = e.target.closest('#wchart circle');
    if (dot) {
      const i = +dot.dataset.i; const p = S.weights[i] || { d: S.profile.startDate, kg: S.profile.startKg };
      let tipEl = $('#charttip');
      if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'charttip'; tipEl.id = 'charttip'; document.body.appendChild(tipEl); }
      tipEl.textContent = `${p.kg} kg · ${p.d}`;
      const r = dot.getBoundingClientRect();
      tipEl.style.left = (r.left + r.width / 2) + 'px'; tipEl.style.top = r.top + 'px';
      clearTimeout(tipEl._h); tipEl._h = setTimeout(() => tipEl.remove(), 2200);
    }
    return;
  }
  const a = el.dataset.action;
  if (a === 'nav') switchTab(el.dataset.tab);
  else if (a === 'gomove') switchTab('move');
  else if (a === 'shuffle') { e.stopPropagation(); shuffleSlot(el.dataset.slot); }
  else if (a === 'recipe') recipeModal(el.dataset.id);
  else if (a === 'closemodal') closeModal();
  else if (a === 'mealfilter') { mealFilter = el.dataset.f; renderMeals(); }
  else if (a === 'reshuffle') { ensureWorkoutNonce(); S.workoutNonce.n++; save(); renderMove(); renderToday(); }
  else if (a === 'checkitem') { el.closest('.witem').classList.toggle('done', el.checked); }
  else if (a === 'timer') startCountdown(+el.dataset.secs);
  else if (a === 'stoptimer') stopCountdown();
  else if (a === 'finish') finishModal();
  else if (a === 'rate') completeSession(el.dataset.r);
  else if (a === 'cup') {
    const w = water(); const i = +el.dataset.i;
    w.cups = (i === w.cups) ? i - 1 : i;
    save(); renderToday();
    if (w.cups === 8) toast('8/8 — hydration complete 💧🏆');
  }
  else if (a === 'coach') coachModal();
  else if (a === 'coachchip') coachAsk(el.dataset.q);
  else if (a === 'coachsend') coachAsk($('#coachText') ? $('#coachText').value : '');
  else if (a === 'coachcopy') coachCopy();
  else if (a === 'sos') sosModal();
  else if (a === 'sostype') sosResults(el.dataset.t);
  else if (a === 'soswin') { S.sos++; save(); closeModal(); renderAll(); toast(`Craving #${S.sos} defeated. That's real discipline 😤`); }
  else if (a === 'quickweigh') logWeightVal($('#quickKg').value);
  else if (a === 'logweight') logWeightVal($('#kgInput').value);
  else if (a === 'settings') settingsModal();
  else if (a === 'savesettings') saveSettings();
  else if (a === 'exportdata') exportData();
  else if (a === 'importdata') $('#importfile').click();
  else if (a === 'resetdata') {
    if (confirm('Reset ALL data — weights, workouts, everything? This cannot be undone.')) {
      localStorage.removeItem(KEY); S = load(); closeModal(); renderAll(); renderWelcome();
    }
  }
  else if (a === 'startjourney') { S.seenWelcome = true; save(); $('#welcome').hidden = true; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'coachText') coachAsk(e.target.value);
});
document.addEventListener('change', e => {
  if (e.target.id === 'importfile' && e.target.files[0]) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const s = JSON.parse(fr.result);
        if (!s.profile || !Array.isArray(s.weights)) throw new Error('bad file');
        localStorage.setItem(KEY, JSON.stringify(s));
        S = load(); closeModal(); renderAll(); toast('Data restored ✔');
      } catch (err) { toast('That file doesn\'t look like a Yalla backup.'); }
    };
    fr.readAsText(e.target.files[0]);
  }
});
$('#modalback').addEventListener('click', e => { if (e.target.id === 'modalback') closeModal(); });

/* ================= init ================= */
function renderAll() {
  $('#headDate').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  renderToday(); renderMeals(); renderMove(); renderProgress();
}
S = load();
// first run: seed the starting weigh-in from the profile
if (!S.weights.length) { S.weights.push({ d: S.profile.startDate, kg: S.profile.startKg }); save(); }
renderAll();
renderWelcome();
switchTab('today');
