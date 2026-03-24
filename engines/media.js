const express = require('express');
const router  = express.Router();

// ── Jingin / Rob Reid Recordings — Music Catalog ──────────────────────────────
// Update cover URLs with actual Bandcamp artwork links
// Bandcamp artwork format: https://f4.bcbits.com/img/a{ALBUM_ID}_10.jpg
const catalog = [
  {
    id:     1,
    title:  'Billy',
    artist: 'Jingin',
    url:    'https://robreidrecordings.bandcamp.com/track/billy',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     2,
    title:  '13 Steps',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/13-steps',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     3,
    title:  'Anything You Want',
    artist: 'Jingin',
    url:    'https://robreidrecordings.bandcamp.com/track/jingin-anything-you-want-official-audio',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     4,
    title:  'UK Wobble But We Don\'t Fall Down (Pop Pop Pop Bottles)',
    artist: 'Jingin',
    url:    'https://robreidrecordings.bandcamp.com/track/uk-wobble-but-we-dont-fall-down-pop-pop-pop-bottles-jingin',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     5,
    title:  'Who Turned The Lights Out (Remix)',
    artist: 'Jingin',
    url:    'https://robreidrecordings.bandcamp.com/track/who-turned-the-lights-out-remix-jingin-official-conscioushiphop',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     6,
    title:  'Guilty Of Loving You',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/guilty-of-loving-you',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     7,
    title:  'Who Turned The Lights Out',
    artist: 'Jingin',
    url:    'https://robreidrecordings.bandcamp.com/track/jingin-who-turned-the-lights-out',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     8,
    title:  'This Thing Called Pride',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/this-thing-called-pride',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     9,
    title:  'Dagger In My Heart',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/dagger-in-my-heart',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     10,
    title:  'I Guess I\'m Not In Heaven Anymore',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/i-guess-im-not-in-heaven-anymore',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     11,
    title:  'Pimped By A Melody',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/pimped-by-a-melody-mp3',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     12,
    title:  'I\'m A Rock Star (3am)',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/i-m-a-rock-star-3am',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     13,
    title:  '7 Chakras',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/7-chakras',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     14,
    title:  'Take 5 Come Alive',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/take-5-come-alive',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     15,
    title:  'I\'m A Rock Star 001',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/i-m-a-rock-star-001',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id:     16,
    title:  'We We We',
    artist: 'Rob Reid Recordings',
    url:    'https://robreidrecordings.bandcamp.com/track/we-we-we',
    cover:  'https://f4.bcbits.com/img/a2245222292_2.jpg'
  }
];

// ── Routes ────────────────────────────────────────────────────────────────────

// Full catalog
router.get('/catalog', (req, res) => {
  // Optional ?artist= filter
  const { artist } = req.query;
  const tracks = artist
    ? catalog.filter(t => t.artist.toLowerCase().includes(artist.toLowerCase()))
    : catalog;
  res.json({ total: tracks.length, tracks });
});

// Single track by id
router.get('/catalog/:id', (req, res) => {
  const id    = parseInt(req.params.id);
  const track = catalog.find(t => t.id === id);
  if (!track) return res.status(404).json({ error: 'Track not found' });
  res.json(track);
});

// Search tracks by title or artist
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query param ?q=' });
  const query  = q.toLowerCase();
  const results = catalog.filter(t =>
    t.title.toLowerCase().includes(query) ||
    t.artist.toLowerCase().includes(query)
  );
  res.json({ total: results.length, tracks: results });
});

// Radio stream info
router.get('/radio', (req, res) => {
  res.json({
    stream:  'https://pinsandneedlesrecords.com/listen/',
    message: 'Pins & Needles Radio — live stream'
  });
});

// Chakra frequencies
router.get('/frequencies', (req, res) => {
  res.json({
    chakras: [
      { id: 1, name: 'Root',        sanskrit: 'Muladhara',    hz: 396,  color: '#FF4D4D' },
      { id: 2, name: 'Sacral',      sanskrit: 'Svadhisthana', hz: 417,  color: '#FFB347' },
      { id: 3, name: 'Solar Plexus',sanskrit: 'Manipura',     hz: 528,  color: '#FFD700' },
      { id: 4, name: 'Heart',       sanskrit: 'Anahata',      hz: 639,  color: '#4CAF50' },
      { id: 5, name: 'Throat',      sanskrit: 'Vishuddha',    hz: 741,  color: '#3498DB' },
      { id: 6, name: 'Third Eye',   sanskrit: 'Ajna',         hz: 852,  color: '#8B5CF6' },
      { id: 7, name: 'Crown',       sanskrit: 'Sahasrara',    hz: 963,  color: '#E0B0FF' }
    ]
  });
});

// Health check
router.get('/test', (req, res) => {
  res.json({ ok: true, catalog_size: catalog.length });
});

module.exports = router;
