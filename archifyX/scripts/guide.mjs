/**
 * Merged scenario guide: platform recipes + leaf engine recipes.
 */
import { PLATFORM_RECIPES } from '../recipes/platform.mjs';
import {
  SCENARIO_RECIPES,
  detectGuideLanguage,
  listScenarioRecipes as listLeafRecipes,
  formatScenarioRecommendation as formatLeafRecommendation
} from '../engine/recipes/scenarios.mjs';

function normalized(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s_]+/g, ' ')
    .trim();
}

function asGuideRecipe(platform) {
  return {
    id: platform.id,
    type: platform.kind || 'platform-atlas',
    proof: platform.id,
    presentation: { preset: 'classic', motion: 'static', views: 'optional' },
    signals: platform.signals,
    en: platform.en,
    zh: platform.zh
  };
}

const ALL = Object.freeze([
  ...PLATFORM_RECIPES.map(asGuideRecipe),
  ...SCENARIO_RECIPES
]);

function localized(recipe, lang) {
  const copy = recipe[lang === 'zh' ? 'zh' : 'en'];
  return {
    id: recipe.id,
    type: recipe.type,
    proof: recipe.proof,
    presentation: { ...recipe.presentation },
    ...copy,
    include: copy.include.slice()
  };
}

function scoreRecipe(recipe, query) {
  const text = normalized(query);
  if (!text) return { recipe, score: 0, matched: [] };
  if (text === recipe.id || text === recipe.id.replace(/-/g, ' ')) {
    return { recipe, score: 100, matched: [recipe.id] };
  }
  let score = 0;
  const matched = [];
  for (const [signal, weight] of recipe.signals) {
    if (text.includes(normalized(signal))) {
      score += weight;
      matched.push(signal);
    }
  }
  return { recipe, score, matched };
}

export { detectGuideLanguage };

export function listScenarioRecipes(lang = 'en') {
  return ALL.map((recipe) => localized(recipe, lang));
}

export function recommendScenario(query, options = {}) {
  const lang =
    options.lang === 'zh' || options.lang === 'en' ? options.lang : detectGuideLanguage(query);
  const ranked = ALL.map((recipe) => scoreRecipe(recipe, query)).sort(
    (left, right) => right.score - left.score || ALL.indexOf(left.recipe) - ALL.indexOf(right.recipe)
  );
  const winner =
    ranked[0].score > 0 ? ranked[0] : { recipe: ALL[0], score: 0, matched: [] };
  const confidence = winner.score >= 14 ? 'high' : winner.score >= 7 ? 'medium' : 'low';
  return {
    ok: true,
    mode: 'recommendation',
    lang,
    query: String(query || ''),
    confidence,
    matchedSignals: winner.matched.slice(),
    recommendation: localized(winner.recipe, lang),
    alternatives: ranked
      .filter((entry) => entry.recipe.id !== winner.recipe.id && entry.score > 0)
      .slice(0, 2)
      .map((entry) => ({ ...localized(entry.recipe, lang), score: entry.score }))
  };
}

export function formatScenarioList(lang = 'en') {
  const isZh = lang === 'zh';
  const recipes = listScenarioRecipes(lang);
  const platformCount = PLATFORM_RECIPES.length;
  const leafCount = listLeafRecipes(lang).length;
  const heading = isZh
    ? `archifyX 场景配方（平台 ${platformCount} + 叶子 ${leafCount}）`
    : `archifyX scenario recipes (platform ${platformCount} + leaf ${leafCount})`;
  const intro = isZh
    ? '先选问题再选图类型。可运行：node bin/archifyX.mjs guide "你的场景"'
    : 'Choose the question before the diagram type. Run: node bin/archifyX.mjs guide "your scenario"';
  return [
    heading,
    '',
    intro,
    '',
    ...recipes.flatMap((recipe) => [
      `${recipe.id}  [${recipe.type}]  ${recipe.title}`,
      `  ${recipe.question}`
    ])
  ].join('\n');
}

export function formatScenarioRecommendation(result) {
  return formatLeafRecommendation(result);
}

export function publicGuideData() {
  return ALL.map((recipe) => ({
    ...localized(recipe, 'en'),
    en: recipe.en,
    zh: recipe.zh,
    signals: recipe.signals.map(([signal, weight]) => [signal, weight])
  }));
}

export default {
  listScenarioRecipes,
  recommendScenario,
  formatScenarioList,
  formatScenarioRecommendation,
  publicGuideData,
  detectGuideLanguage
};
