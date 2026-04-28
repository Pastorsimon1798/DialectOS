#!/usr/bin/env node
/**
 * Adds 3 new adversarial samples to each of the 25 dialect fixture files.
 * Categories: negation-preservation, formality-consistency, cultural-adaptation
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";

const fixtureDir = "packages/cli/src/__tests__/fixtures/dialect-adversarial";

// Dialect-specific data
const culturalData = {
  "es-ES": { food: "tortilla española", holiday: "Nochevieja", currency: "euros" },
  "es-MX": { food: "tamales", holiday: "Día de los Muertos", currency: "pesos" },
  "es-AR": { food: "asado", holiday: "Día de la Independencia", currency: "pesos" },
  "es-CO": { food: "arepas", holiday: "Día de las Velitas", currency: "pesos" },
  "es-CU": { food: "ropa vieja", holiday: "Rebelión del Moncada", currency: "pesos" },
  "es-PE": { food: "ceviche", holiday: "Fiestas Patrias", currency: "soles" },
  "es-CL": { food: "empanadas de pino", holiday: "Fiestas Patrias", currency: "pesos" },
  "es-VE": { food: "arepas", holiday: "Carnaval", currency: "bolívares" },
  "es-UY": { food: "chivito", holiday: "Natalicio de Artigas", currency: "pesos" },
  "es-PY": { food: "chipa", holiday: "Día de la Independencia", currency: "guaraníes" },
  "es-BO": { food: "salteñas", holiday: "Día del Mar", currency: "bolivianos" },
  "es-EC": { food: "encebollado", holiday: "Carnaval", currency: "dólares" },
  "es-GT": { food: "fiambre", holiday: "Día de los Muertos", currency: "quetzales" },
  "es-HN": { food: "baleadas", holiday: "Día de la Independencia", currency: "lempiras" },
  "es-SV": { food: "pupusas", holiday: "Día de la Independencia", currency: "dólares" },
  "es-NI": { food: "gallo pinto", holiday: "Día de la Independencia", currency: "córdobas" },
  "es-CR": { food: "gallo pinto", holiday: "Día de la Independencia", currency: "colones" },
  "es-PA": { food: "sancocho", holiday: "Carnaval", currency: "balboas" },
  "es-DO": { food: "mangú", holiday: "Carnaval", currency: "pesos" },
  "es-PR": { food: "mofongo", holiday: "Navidad", currency: "dólares" },
  "es-GQ": { food: "sucú", holiday: "Día de la Independencia", currency: "francos" },
  "es-US": { food: "tacos", holiday: "Cinco de Mayo", currency: "dólares" },
  "es-PH": { food: "adobo filipino", holiday: "Fiesta", currency: "pesos" },
  "es-BZ": { food: "rice and beans", holiday: "September Celebration", currency: "dólares" },
  "es-AD": { food: "trucha", holiday: "Nochevieja", currency: "euros" },
};

const forbiddenByDialect = {
  "es-ES": ["vos", "vosotros"],
  "es-MX": ["coger", "vos", "vosotros"],
  "es-AR": ["coger", "vosotros", "tú"],
  "es-CO": ["coger", "vos", "vosotros"],
  "es-CU": ["coger", "vos", "vosotros"],
  "es-PE": ["coger", "vos", "vosotros"],
  "es-CL": ["coger", "vos", "vosotros"],
  "es-VE": ["coger", "vosotros"],
  "es-UY": ["coger", "vosotros", "tú"],
  "es-PY": ["coger", "vosotros"],
  "es-BO": ["coger", "vos", "vosotros"],
  "es-EC": ["coger", "vos", "vosotros"],
  "es-GT": ["coger", "vosotros"],
  "es-HN": ["coger", "vosotros"],
  "es-SV": ["coger", "vosotros"],
  "es-NI": ["coger", "vosotros"],
  "es-CR": ["coger", "vosotros"],
  "es-PA": ["coger", "vos", "vosotros"],
  "es-DO": ["coger", "vos", "vosotros"],
  "es-PR": ["coger", "vos", "vosotros"],
  "es-GQ": ["coger", "vos", "vosotros"],
  "es-US": ["coger", "vosotros"],
  "es-PH": ["coger", "vos", "vosotros"],
  "es-BZ": ["coger", "vos", "vosotros"],
  "es-AD": ["vos"],
};

function makeNegationSample(dialect) {
  const prefix = dialect.slice(3).toLowerCase();
  const forbidden = forbiddenByDialect[dialect] || [];
  return {
    id: `${prefix}-negation-do-not`,
    category: "negation-preservation",
    severity: "critical",
    tags: ["negation", "semantic"],
    source: "Do not delete the database without a backup.",
    domain: "technical",
    register: "formal",
    documentKind: "plain",
    requiredContext: ["Negation must survive translation", dialect],
    forbiddenContext: [],
    forbiddenOutputTerms: [...forbidden],
    preferredOutputAny: ["no elimine", "no elimines", "no borre", "no borres"],
    notes: "Negation (do not) must be preserved. Dropping negation in a technical warning could cause data loss.",
    requiredOutputGroups: [["base", "datos", "base de datos"], ["copia", "seguridad", "respaldo"]],
  };
}

function makeFormalitySample(dialect) {
  const prefix = dialect.slice(3).toLowerCase();
  const forbidden = forbiddenByDialect[dialect] || [];
  const isVoseo = ["es-AR", "es-UY", "es-PY", "es-GT", "es-HN", "es-SV", "es-NI"].includes(dialect);
  const isVosotros = ["es-ES", "es-AD"].includes(dialect);

  let preferredVerbs;
  if (isVoseo) {
    preferredVerbs = ["podés", "actualizá", "configurá"];
  } else if (isVosotros) {
    preferredVerbs = ["podéis", "actualizad", "configurad"];
  } else {
    preferredVerbs = ["puedes", "actualiza", "configura"];
  }

  return {
    id: `${prefix}-formality-account`,
    category: "formality-consistency",
    severity: "high",
    tags: ["formality", "register", "account"],
    source: "You can update your account settings in the profile page.",
    domain: "technical",
    register: "informal",
    documentKind: "plain",
    requiredContext: ["Informal register consistency", dialect],
    forbiddenContext: [],
    forbiddenOutputTerms: [...forbidden],
    preferredOutputAny: preferredVerbs,
    notes: `Informal register must be consistent throughout. ${isVoseo ? "Use voseo forms." : isVosotros ? "Use vosotros forms." : "Use tú forms."}`,
    requiredOutputGroups: [["cuenta", "perfil", "configuración"]],
  };
}

function makeCulturalSample(dialect) {
  const prefix = dialect.slice(3).toLowerCase();
  const forbidden = forbiddenByDialect[dialect] || [];
  const data = culturalData[dialect];

  return {
    id: `${prefix}-cultural-food`,
    category: "cultural-adaptation",
    severity: "medium",
    tags: ["cultural", "food", "adaptation"],
    source: `The traditional dish for the holiday celebration includes ${data.food}.`,
    domain: "general",
    register: "auto",
    documentKind: "plain",
    requiredContext: ["Cultural food term preservation", dialect, data.food],
    forbiddenContext: [],
    forbiddenOutputTerms: [...forbidden],
    preferredOutputAny: [data.food, "platillo", "plato", "comida"],
    notes: `Cultural food term '${data.food}' should be preserved or appropriately adapted for ${dialect} context.`,
    requiredOutputGroups: [["celebración", "fiesta", "festividad", "holiday"]],
  };
}

// Process each dialect
const files = [];
const { readdirSync } = await import("node:fs");
for (const file of readdirSync(fixtureDir).filter(f => f.endsWith(".json")).sort()) {
  const dialect = basename(file, ".json");
  const filePath = join(fixtureDir, file);
  const existing = JSON.parse(readFileSync(filePath, "utf-8"));

  const newSamples = [
    makeNegationSample(dialect),
    makeFormalitySample(dialect),
    makeCulturalSample(dialect),
  ];

  // Only add if samples with these IDs don't already exist
  const existingIds = new Set(existing.map(s => s.id));
  const toAdd = newSamples.filter(s => !existingIds.has(s.id));

  if (toAdd.length > 0) {
    existing.push(...toAdd);
    writeFileSync(filePath, JSON.stringify(existing, null, 2) + "\n");
    files.push({ dialect, added: toAdd.length });
  }
}

console.log(`Added samples to ${files.length} dialect files:`);
for (const f of files) {
  console.log(`  ${f.dialect}: +${f.added} samples`);
}

const total = files.reduce((sum, f) => sum + f.added, 0);
console.log(`Total: ${total} new samples added`);
