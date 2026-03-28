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

export async function getJourneyEventDescription(eventId: string): Promise<string> {
  const res = await fetch(`/api/Product/journey/${eventId}/description`, {
    headers: { Authorization: `Bearer ${accessToken ?? ''}` },
  })
  if (!res.ok) throw new Error('Failed to fetch description')
  const data = await res.json()
  return data.description
}
