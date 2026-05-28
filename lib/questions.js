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
    illustration: "https://example.com/illustrations/nantes-oslo.jpg"
  },
  {
    id: 2,
    text: "Quelle est la densité de population de la Norvège ? (Pour comparaison, celle de la France est d'environ 119 hab/km²)",
    options: [
      "14.2 hab/km²",
      "48.7 hab/km²",
      "95.3 hab/km²",
      "191.5 hab/km²"
    ],
    correctAnswerIndex: 0,
    illustration: "https://example.com/illustrations/population-density.jpg"
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
  }
];
