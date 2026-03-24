const express = require('express');
const router = express.Router();

// Your Bandcamp catalog – update this list when you add new tracks
const catalog = [
  {
    id: 1,
    title: 'BILLY',
    artist: 'JINGIN',
    url: 'https://bandcamp.com/track/billy',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg' // placeholder – replace with actual cover URL if available
  },
  {
    id: 2,
    title: '13 STEPS',
    artist: 'rob reid recordings',
    url: 'https://bandcamp.com/track/13-steps',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 3,
    title: 'JINGIN - Anything You Want (Official Audio)',
    artist: 'ROB REID RECORDINGS',
    url: 'https://bandcamp.com/track/jingin-anything-you-want-official-audio',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 4,
    title: '"UK Wobble But We Don\'t Fall Down" - POP POP POP BOTTLES | JINGIN',
    artist: 'jingin',
    url: 'https://bandcamp.com/track/uk-wobble-but-we-dont-fall-down-pop-pop-pop-bottles-jingin',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 5,
    title: 'Who Turned The Lights Out REMIX - JINGIN (Official) #ConsciousHipHop',
    artist: 'jingin',
    url: 'https://bandcamp.com/track/who-turned-the-lights-out-remix-jingin-official-conscioushiphop',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 6,
    title: 'Guilty Of Loving You',
    artist: 'rob reid recordings',
    url: 'https://bandcamp.com/track/guilty-of-loving-you',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 7,
    title: '**JINGIN - "Who Turned The Lights Out"**',
    artist: 'rob reid recordings',
    url: 'https://bandcamp.com/track/jingin-who-turned-the-lights-out',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 8,
    title: 'This Thing Called Pride',
    artist: 'ROBREIDRECORDINGS',
    url: 'https://bandcamp.com/track/this-thing-called-pride',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 9,
    title: 'Dagger_in_my_heart',
    artist: 'ROBREIDRECORDINGS',
    url: 'https://bandcamp.com/track/dagger-in-my-heart',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 10,
    title: 'I guess im not in heaven anymore',
    artist: 'Rob Reid Recordings',
    url: 'https://bandcamp.com/track/i-guess-im-not-in-heaven-anymore',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 11,
    title: 'Pimped by a melody Mp3',
    artist: 'ROBREID RECORDINGS',
    url: 'https://bandcamp.com/track/pimped-by-a-melody-mp3',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 12,
    title: 'I M A ROCK STAR 3AM',
    artist: 'ROB REID RECORDINGS',
    url: 'https://bandcamp.com/track/i-m-a-rock-star-3am',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 13,
    title: '7 CHAKRAS',
    artist: 'ROB REID RECORDINGS',
    url: 'https://bandcamp.com/track/7-chakras',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 14,
    title: 'TAKE 5 COME ALIVE',
    artist: 'ROB REID RECORDINGS',
    url: 'https://bandcamp.com/track/take-5-come-alive',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 15,
    title: 'I M A ROCK STAR 001',
    artist: 'rob reid recordings',
    url: 'https://bandcamp.com/track/i-m-a-rock-star-001',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  },
  {
    id: 16,
    title: 'WE WE WE',
    artist: 'Rob Reid Recordings',
    url: 'https://bandcamp.com/track/we-we-we',
    cover: 'https://f4.bcbits.com/img/a2245222292_2.jpg'
  }
];

// GET /api/media/catalog – full music catalog
router.get('/catalog', (req, res) => {
  res.json({ total: catalog.length, tracks: catalog });
});

// GET /api/media/catalog/:id – single track by id
router.get('/catalog/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const track = catalog.find(t => t.id === id);
  if (!track) return res.status(404).json({ error: 'Track not found' });
  res.json(track);
});

// Additional endpoints you might want later
router.get('/radio', (req, res) => {
  res.json({ message: 'Radio stream info – to be implemented' });
});

router.get('/frequencies', (req, res) => {
  res.json({ message: 'Chakra frequencies – see /api/content/chakras' });
});
router.get('/test', (req, res) => {
  res.json({ ok: true });
});
module.exports = router;
