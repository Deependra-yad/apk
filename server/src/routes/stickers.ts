import { Router } from 'express';

const router = Router();

const STICKER_PACKS = [
  {
    name: 'Liquid Waves 🌊',
    stickers: [
      { id: 'wave_1', name: 'Surfing Wave', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80', emoji: '🌊' },
      { id: 'wave_2', name: 'Splash Drop', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=200&q=80', emoji: '💧' },
      { id: 'wave_3', name: 'Deep Ocean', url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=200&q=80', emoji: '🐳' }
    ]
  },
  {
    name: 'Cyberpunk & Neon ⚡',
    stickers: [
      { id: 'cyber_1', name: 'Neon Lightning', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80', emoji: '⚡' },
      { id: 'cyber_2', name: 'Future Glow', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80', emoji: '🔮' },
      { id: 'cyber_3', name: 'Matrix Pulse', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80', emoji: '💻' }
    ]
  },
  {
    name: 'Party & Celebration 🎉',
    stickers: [
      { id: 'party_1', name: 'Confetti Boom', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=200&q=80', emoji: '🎉' },
      { id: 'party_2', name: 'Sparkler Night', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=200&q=80', emoji: '✨' },
      { id: 'party_3', name: 'Rocket Fire', url: 'https://images.unsplash.com/photo-1517976487588-348e3e7f603c?auto=format&fit=crop&w=200&q=80', emoji: '🚀' }
    ]
  }
];

const TRENDING_GIFS = [
  { id: 'gif_1', title: 'Thumbs Up Liquid', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'gif_2', title: 'Cheers Celebration', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
  { id: 'gif_3', title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'gif_4', title: 'Typing Cat', url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif' },
  { id: 'gif_5', title: 'Dance Party', url: 'https://media.giphy.com/media/l3q2wJsC23ikJg9xe/giphy.gif' },
  { id: 'gif_6', title: 'Happy Dance', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'gif_7', title: 'Popcorn Chill', url: 'https://media.giphy.com/media/GLbiGvv9RiNpCdjxY5/giphy.gif' },
  { id: 'gif_8', title: 'Rocket Launch', url: 'https://media.giphy.com/media/3ohnEqJ1XOfvWaSk7e/giphy.gif' }
];

router.get('/', (req, res) => {
  res.json({ packs: STICKER_PACKS, gifs: TRENDING_GIFS });
});

router.get('/search-gifs', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase();
  const filtered = TRENDING_GIFS.filter(g => g.title.toLowerCase().includes(q));
  res.json(filtered.length > 0 ? filtered : TRENDING_GIFS);
});

export default router;

