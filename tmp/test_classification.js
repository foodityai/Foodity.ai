import { classifyQuery } from '../server/services/nutritionIntelligence.js';

const tests = ["yo", "yo!", "hi", "hello", "apple", "how many calories in pizza"];
tests.forEach(t => {
  console.log(`"${t}" => ${classifyQuery(t)}`);
});
