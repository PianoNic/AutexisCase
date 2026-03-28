import type {
  ShelfLifePrediction,
  AnomalyDetectionResult,
  SustainabilityAnalysis,
  ProductAlternatives,
} from '@/types/ai-features'

// --- Shelf Life Predictions ---

const shelfLifePredictions: Record<string, ShelfLifePrediction> = {
  tomatoes: {
    productId: 'tomatoes',
    predictedDaysRemaining: 4,
    confidence: 0.89,
    qualityProgression: [
      { day: 0, quality: 95, label: 'Heute' },
      { day: 1, quality: 88, label: 'Tag 1' },
      { day: 2, quality: 78, label: 'Tag 2' },
      { day: 3, quality: 65, label: 'Tag 3' },
      { day: 4, quality: 48, label: 'Tag 4' },
      { day: 5, quality: 30, label: 'Tag 5' },
      { day: 6, quality: 15, label: 'Tag 6' },
      { day: 7, quality: 5, label: 'Tag 7' },
    ],
    riskFactors: [
      { id: 'r1', factor: 'Temperatur-Schwankung', impact: 'medium', description: 'Leichte Abweichung beim Transport' },
      { id: 'r2', factor: 'Verpackung intakt', impact: 'low', description: 'Keine Beschädigungen erkannt' },
      { id: 'r3', factor: 'Reifegrad', impact: 'medium', description: 'Produkt bei Ernte bereits reif' },
    ],
    recommendation: 'Innerhalb von 4 Tagen verbrauchen für beste Qualität.',
  },
  chocolate: {
    productId: 'chocolate',
    predictedDaysRemaining: 180,
    confidence: 0.95,
    qualityProgression: [
      { day: 0, quality: 98, label: 'Heute' },
      { day: 30, quality: 96, label: 'Mo 1' },
      { day: 60, quality: 93, label: 'Mo 2' },
      { day: 90, quality: 89, label: 'Mo 3' },
      { day: 120, quality: 82, label: 'Mo 4' },
      { day: 150, quality: 72, label: 'Mo 5' },
      { day: 180, quality: 60, label: 'Mo 6' },
    ],
    riskFactors: [
      { id: 'r1', factor: 'Temperatur-Überschreitung', impact: 'high', description: 'Temperaturspitze von 24°C erkannt' },
      { id: 'r2', factor: 'Luftfeuchtigkeit', impact: 'low', description: 'Innerhalb normaler Parameter' },
    ],
    recommendation: 'Trotz Temperaturspitze noch lange haltbar. Auf Fettreif prüfen.',
  },
}

// --- Anomaly Detection ---

const anomalyResults: Record<string, AnomalyDetectionResult> = {
  tomatoes: {
    productId: 'tomatoes',
    anomalies: [],
    overallRisk: 'low',
    chainIntegrityScore: 97,
  },
  chocolate: {
    productId: 'chocolate',
    anomalies: [
      {
        id: 'a1',
        productId: 'chocolate',
        detectedAt: new Date('2026-03-10T15:00:00'),
        severity: 'warning',
        type: 'spike',
        title: 'Temperaturspitze erkannt',
        description: 'Temperatur stieg auf 24°C während Transport durch Südfrankreich.',
        temperatureRange: { min: 18, max: 24 },
        duration: '45 Min',
        impactAssessment: 'Möglicher Fettreif, keine gesundheitliche Gefährdung.',
        affectedQualityPercent: 5,
      },
    ],
    overallRisk: 'medium',
    chainIntegrityScore: 78,
  },
}

// --- Sustainability Analysis ---

const sustainabilityAnalyses: Record<string, SustainabilityAnalysis> = {
  tomatoes: {
    productId: 'tomatoes',
    co2Breakdown: [
      { id: 's1', stage: 'Anbau', co2Kg: 0.15, percentage: 38 },
      { id: 's2', stage: 'Transport', co2Kg: 0.12, percentage: 30 },
      { id: 's3', stage: 'Verpackung', co2Kg: 0.08, percentage: 20 },
      { id: 's4', stage: 'Kühlung', co2Kg: 0.05, percentage: 12 },
    ],
    totalCo2Kg: 0.4,
    comparisonToAverage: -25,
    waterFootprintL: 214,
    transportDistanceKm: 120,
    packagingScore: 'B',
    seasonalityBonus: true,
    localBonus: true,
    ecoTips: [
      'Saisonale Tomaten haben den geringsten Fußabdruck',
      'Unverpackte Ware spart zusätzlich CO₂',
    ],
  },
  chocolate: {
    productId: 'chocolate',
    co2Breakdown: [
      { id: 's1', stage: 'Anbau', co2Kg: 1.8, percentage: 45 },
      { id: 's2', stage: 'Transport', co2Kg: 1.2, percentage: 30 },
      { id: 's3', stage: 'Verpackung', co2Kg: 0.5, percentage: 13 },
      { id: 's4', stage: 'Produktion', co2Kg: 0.5, percentage: 12 },
    ],
    totalCo2Kg: 4.0,
    comparisonToAverage: 15,
    waterFootprintL: 1700,
    transportDistanceKm: 6200,
    packagingScore: 'C',
    seasonalityBonus: false,
    localBonus: false,
    ecoTips: [
      'Fairtrade-Schokolade fördert nachhaltigen Anbau',
      'Regionale Marken mit kürzeren Lieferketten bevorzugen',
    ],
  },
}

// --- Alternative Products ---

const productAlternatives: Record<string, ProductAlternatives> = {
  tomatoes: {
    productId: 'tomatoes',
    alternatives: [
      {
        id: 'alt1',
        name: 'Rispentomaten Regional',
        brand: 'Hofgut Müller',
        imageUrl: 'https://images.openfoodfacts.org/images/products/20004758/front_de.9.200.jpg',
        nutriScore: 'A',
        co2Kg: 0.25,
        reason: '37% weniger CO₂ durch regionalen Anbau',
        improvementTags: ['regional', 'weniger CO₂'],
      },
      {
        id: 'alt2',
        name: 'Bio Strauchtomaten',
        brand: 'Demeter',
        imageUrl: 'https://images.openfoodfacts.org/images/products/20004758/front_de.9.200.jpg',
        nutriScore: 'A',
        co2Kg: 0.3,
        reason: 'Bio-Anbau ohne Pestizide',
        improvementTags: ['bio', 'besser bewertet'],
      },
    ],
  },
  chocolate: {
    productId: 'chocolate',
    alternatives: [
      {
        id: 'alt1',
        name: 'Fairtrade Edelbitter 70%',
        brand: 'GEPA',
        imageUrl: 'https://images.openfoodfacts.org/images/products/400/131/214/0637/front_de.6.200.jpg',
        nutriScore: 'D',
        co2Kg: 3.2,
        reason: '20% weniger CO₂, Fairtrade-zertifiziert',
        improvementTags: ['weniger CO₂', 'bio'],
      },
      {
        id: 'alt2',
        name: 'Schweizer Zartbitter',
        brand: 'Villars',
        imageUrl: 'https://images.openfoodfacts.org/images/products/400/131/214/0637/front_de.6.200.jpg',
        nutriScore: 'D',
        co2Kg: 2.8,
        reason: 'Kürzerer Transportweg aus der Schweiz',
        improvementTags: ['regional', 'weniger CO₂'],
      },
    ],
  },
}

// --- Chat Responses ---

const chatResponses: Record<string, Record<string, string>> = {
  tomatoes: {
    haltbarkeit: 'Die Bio Cherry-Tomaten sind laut KI-Prognose noch ca. 4 Tage optimal genießbar. Die Qualität liegt aktuell bei 95%. Am besten kühl lagern und bald verbrauchen.',
    kühlkette: 'Die Kühlkette ist intakt — keine Anomalien erkannt. Die Integrität liegt bei 97/100. Die Durchschnittstemperatur während des Transports war im optimalen Bereich.',
    co2: 'Der CO₂-Fußabdruck liegt bei 0,4 kg — das sind 25% weniger als der Durchschnitt für Tomaten. Der größte Anteil entfällt auf den Anbau (38%), gefolgt vom Transport (30%).',
    alternative: 'Eine nachhaltigere Alternative wären die Rispentomaten von Hofgut Müller (regional, 37% weniger CO₂) oder die Bio Strauchtomaten von Demeter.',
    herkunft: 'Die Tomaten stammen aus Spanien (Almería) und wurden über 3 Stationen nach Deutschland transportiert. Die Gesamtstrecke beträgt ca. 120 km ab Verteilzentrum.',
  },
  chocolate: {
    haltbarkeit: 'Die Schokolade ist noch ca. 180 Tage haltbar. Trotz einer Temperaturspitze von 24°C liegt die Qualität bei 98%. Auf möglichen Fettreif achten.',
    kühlkette: 'Es wurde eine Anomalie erkannt: Am 10.03. stieg die Temperatur für 45 Minuten auf 24°C. Die Kettenintegrität liegt bei 78/100. Keine gesundheitliche Gefährdung.',
    co2: 'Der CO₂-Fußabdruck ist mit 4,0 kg relativ hoch (15% über Durchschnitt). Hauptverursacher sind Kakaoanbau (45%) und der Transport über 6.200 km aus Belgien.',
    alternative: 'Die Fairtrade Edelbitter von GEPA hat 20% weniger CO₂ und ist Fairtrade-zertifiziert. Auch die Schweizer Zartbitter von Villars hat kürzere Transportwege.',
    herkunft: 'Die Schokolade wird in Belgien hergestellt. Der Kakao stammt aus Westafrika. Der Transport nach Deutschland erfolgte über 6.200 km.',
  },
}

const defaultResponses: Record<string, string> = {
  haltbarkeit: 'Scanne ein Produkt, um die Haltbarkeitsprognose zu sehen.',
  kühlkette: 'Scanne ein Produkt, um die Kühlketten-Analyse einzusehen.',
  co2: 'Scanne ein Produkt, um den ökologischen Fußabdruck zu sehen.',
  alternative: 'Scanne ein Produkt, um nachhaltigere Alternativen zu finden.',
  default: 'Ich kann dir Informationen zu Haltbarkeit, Kühlkette, CO₂-Fußabdruck und Alternativen geben. Scanne ein Produkt oder frag mich etwas Konkretes!',
}

// --- Accessor functions ---

export function getShelfLifePrediction(id: string): ShelfLifePrediction | undefined {
  return shelfLifePredictions[id]
}

export function getAnomalyDetection(id: string): AnomalyDetectionResult | undefined {
  return anomalyResults[id]
}

export function getSustainabilityAnalysis(id: string): SustainabilityAnalysis | undefined {
  return sustainabilityAnalyses[id]
}

export function getProductAlternatives(id: string): ProductAlternatives | undefined {
  return productAlternatives[id]
}

export function getMockChatResponse(query: string, productId?: string | null): string {
  const q = query.toLowerCase()
  const productResponses = productId ? chatResponses[productId] : undefined

  const keywords: [string[], string][] = [
    [['haltbar', 'ablauf', 'shelf', 'verderb', 'frisch', 'qualität'], 'haltbarkeit'],
    [['kühl', 'temperatur', 'kette', 'anomalie', 'transport'], 'kühlkette'],
    [['co2', 'nachhaltig', 'fußabdruck', 'öko', 'umwelt', 'klima'], 'co2'],
    [['alternativ', 'besser', 'empfehlung', 'ersetzen', 'tausch'], 'alternative'],
    [['herkunft', 'woher', 'land', 'ursprung', 'region'], 'herkunft'],
  ]

  for (const [words, key] of keywords) {
    if (words.some((w) => q.includes(w))) {
      return productResponses?.[key] ?? defaultResponses[key] ?? defaultResponses.default
    }
  }

  return productResponses
    ? 'Ich kann dir Infos zur Haltbarkeit, Kühlkette, CO₂-Bilanz, Herkunft oder Alternativen geben. Was interessiert dich?'
    : defaultResponses.default
}
