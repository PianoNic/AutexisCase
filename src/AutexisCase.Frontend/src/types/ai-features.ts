// --- Shelf Life Prediction ---
export interface ShelfLifePrediction {
  productId: string
  predictedDaysRemaining: number
  confidence: number
  qualityProgression: QualityDataPoint[]
  riskFactors: RiskFactor[]
  recommendation: string
}

export interface QualityDataPoint {
  day: number
  quality: number
  label: string
}

export interface RiskFactor {
  id: string
  factor: string
  impact: 'low' | 'medium' | 'high'
  description: string
}

// --- Cold Chain Anomaly Detection ---
export interface ColdChainAnomaly {
  id: string
  productId: string
  detectedAt: Date
  severity: 'info' | 'warning' | 'critical'
  type: 'spike' | 'sustained' | 'pattern'
  title: string
  description: string
  temperatureRange: { min: number; max: number }
  duration: string
  impactAssessment: string
  affectedQualityPercent: number
}

export interface AnomalyDetectionResult {
  productId: string
  anomalies: ColdChainAnomaly[]
  overallRisk: 'low' | 'medium' | 'high'
  chainIntegrityScore: number
}

// --- Chat Assistant ---
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  productContext?: string
}

// --- CO2 & Sustainability ---
export interface SustainabilityAnalysis {
  productId: string
  co2Breakdown: CO2BreakdownItem[]
  totalCo2Kg: number
  comparisonToAverage: number
  waterFootprintL: number
  transportDistanceKm: number
  packagingScore: 'A' | 'B' | 'C' | 'D' | 'E'
  seasonalityBonus: boolean
  localBonus: boolean
  ecoTips: string[]
}

export interface CO2BreakdownItem {
  id: string
  stage: string
  co2Kg: number
  percentage: number
}

// --- Alternative Products ---
export interface AlternativeProduct {
  id: string
  name: string
  brand: string
  imageUrl: string
  nutriScore: string
  co2Kg: number
  reason: string
  improvementTags: string[]
}

export interface ProductAlternatives {
  productId: string
  alternatives: AlternativeProduct[]
}
