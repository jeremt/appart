// Vérifie que chaque entrée de BUILDERS correspond à une fonction définie dans furniture.js
import {readFileSync} from 'node:fs';
const src = readFileSync('src/furniture.js', 'utf8');
const block = src.slice(src.indexOf('export const BUILDERS = {'));
const names = [...block.matchAll(/^\s+(\w+),$/gm)].map((m) => m[1]);
const missing = names.filter((n) => !new RegExp(`(function ${n}\\(|const ${n} = )`).test(src));
if (missing.length) {
    console.error('Builders manquants :', missing.join(', '));
    process.exit(1);
}
console.log(`OK : ${names.length} builders définis`);
