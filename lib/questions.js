export const questions = [
  {
    id: 1,
    text: "Quelle est la distance à vol d'oiseau entre Nantes et Oslo ?",
    options: [
      "1 200 km",
      "1 500 km",
      "1 800 km",
      "2 100 km"
    ],
    correctAnswerIndex: 2,
    illustration: "/illustrations/nantes-oslo.webp"
  },
  {
    id: 2,
    text: "Quelle est la population de la Norvège en 2026 ? (en millions)",
    type: 'slider',
    min: 1,
    max: 100,
    correctValue: 5.6,
    tolerance: 3,
    ticks: [{ value: 69, label: 'France' }],
    options: [], // unused, for compatibility
    correctAnswerIndex: 0,
  },
  {
    id: 3,
    text: "À ton avis, de quel animal s'agit-il ?",
    options: ["Otarie", "Phoque", "Morse", "Lamantin"],
    correctAnswerIndex: 1,
    illustrations: ["/phoque-1.jpg", "/phoque-2.jpg"]
  },
  {
    id: 4,
    text: "Que signifie le célèbre dicton norvégien \"Ut på tur, aldri sur\" ?",
    options: [
      "Il n'y a pas de mauvais temps, il n'y a que des mauvais vêtements",
      "Qui part à l'aventure trouve toujours un abri sûr",
      "Qui voyage loin ménage sa monture",
      "Dehors en balade, jamais grincheux !"
    ],
    correctAnswerIndex: 3
  },
  {
    id: 5,
    text: "Parmi ces 4 affirmations, laquelle est FAUSSE à propos du cercle polaire arctique ?",
    options: [
      "Il marque la limite géographique à partir de laquelle on peut observer le soleil de minuit.",
      "Sa position sur la Terre est fixe et immuable depuis des millions d'années.",
      "En Norvège, le cercle polaire traverse le pays un peu au sud de la ville de Bodø.",
      "Le jour du solstice d'hiver, le soleil ne se lève pas du tout au-dessus de cette ligne."
    ],
    correctAnswerIndex: 1
  }
];
