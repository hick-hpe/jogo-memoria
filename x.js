let frutas = [
    'abacaxi',
    'pera',
    'uva',
    'apple',
    'cereja',
    'abacate',
    'melancia',
    'morango',
    'laranja',
    'pessego',
    'mirtilos',
    'kiwi',
];

frutas = frutas.sort(() => Math.random() - 0.5);
frutas = frutas.sort(() => Math.random() - 0.5);
console.log(frutas);