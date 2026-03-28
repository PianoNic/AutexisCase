import { Configuration } from './runtime'
import { ProductApi } from './apis/ProductApi'
import { ScanApi } from './apis/ScanApi'
import { OcrApi } from './apis/OcrApi'

let accessToken: string | null = null

export function setApiToken(token: string | null) {
  accessToken = token
}

const config = new Configuration({
  basePath: '',
  accessToken: () => accessToken ?? '',
})

export const productApi = new ProductApi(config)
export const scanApi = new ScanApi(config)
export const ocrApi = new OcrApi(config)

export async function getPersonalizedView(productId: string, batchId: string | undefined, prompt: string): Promise<string> {
  const url = batchId
    ? `/api/Product/${productId}/personalized-view?batchId=${batchId}`
    : `/api/Product/${productId}/personalized-view`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken ?? ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) throw new Error('Failed to fetch personalized view')
  const data = await res.json()
  return data.content
}

export async function getJourneyEventDescription(eventId: string): Promise<string> {
  const res = await fetch(`/api/Product/journey/${eventId}/description`, {
    headers: { Authorization: `Bearer ${accessToken ?? ''}` },
  })
  if (!res.ok) throw new Error('Failed to fetch description')
  const data = await res.json()
  return data.description
}
