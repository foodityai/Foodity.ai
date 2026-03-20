import axios from 'axios';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1/foods/search';

// Keywords that trigger a USDA nutrition lookup
const NUTRITION_KEYWORDS = [
  'calories', 'calorie', 'nutrition', 'nutritional', 'protein',
  'carbs', 'carbohydrates', 'fat', 'vitamins', 'vitamin',
  'minerals', 'mineral', 'fiber', 'nutrient', 'macros',
  'kcal', 'potassium', 'sodium', 'sugar', 'calories in',
  'how many calories', 'how much protein'
];

export function isFoodNutritionQuery(message) {
  const lower = message.toLowerCase();
  return NUTRITION_KEYWORDS.some(kw => lower.includes(kw));
}

export async function getFoodNutrition(query) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    return null; // Silently fallback to Groq if no key
  }

  try {
    const response = await axios.get(USDA_BASE, {
      params: {
        query,
        api_key: apiKey,
        pageSize: 1,
        dataType: 'SR Legacy,Foundation,Survey (FNDDS)',
      }
    });

    const foods = response.data?.foods;
    if (!foods || foods.length === 0) return null;

    const food = foods[0];
    const nutrients = food.foodNutrients || [];

    // Helper to find nutrient by name
    const find = (...names) => {
      for (const name of names) {
        const n = nutrients.find(n =>
          n.nutrientName?.toLowerCase().includes(name.toLowerCase())
        );
        if (n) return { value: n.value, unit: n.unitName };
      }
      return null;
    };

    const main = {
      name: food.description,
      servingSize: '100g',
      calories: find('Energy'),
      protein: find('Protein'),
      carbs: find('Carbohydrate'),
      fat: find('Total lipid'),
      fiber: find('Fiber'),
      sugar: find('Sugars'),
    };

    const MAIN_KEYS = ['Energy', 'Protein', 'Carbohydrate', 'Total lipid', 'Fiber', 'Sugars'];
    const others = nutrients
      .filter(n => !MAIN_KEYS.some(k => n.nutrientName?.toLowerCase().includes(k.toLowerCase())))
      .filter(n => n.value && n.value > 0)
      .slice(0, 10)
      .map(n => ({ name: n.nutrientName, value: n.value, unit: n.unitName }));

    return { main, others };
  } catch (err) {
    console.error('USDA API error:', err.message);
    return null;
  }
}

export function formatNutritionData(foodData) {
  const { main, others } = foodData;
  const fmt = (val) => val ? `${val.value} ${val.unit}` : 'N/A';

  let text = `USDA NUTRITION DATA for "${main.name}" (${main.servingSize}):\n`;
  text += `Calories: ${fmt(main.calories)}\n`;
  text += `Protein: ${fmt(main.protein)}\n`;
  text += `Carbohydrates: ${fmt(main.carbs)}\n`;
  text += `Fat: ${fmt(main.fat)}\n`;
  text += `Fiber: ${fmt(main.fiber)}\n`;
  text += `Sugar: ${fmt(main.sugar)}\n`;
  if (others.length > 0) {
    text += `Other nutrients: ${others.map(o => `${o.name} (${o.value} ${o.unit})`).join(', ')}\n`;
  }
  return text;
}
