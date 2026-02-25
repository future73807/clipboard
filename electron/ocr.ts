import { createWorker } from 'tesseract.js'

export async function recognizeText(imageSource: string | Buffer, lang: string = 'chi_sim+eng'): Promise<string> {
  try {
    const worker = await createWorker(lang)
    const ret = await worker.recognize(imageSource)
    await worker.terminate()
    return ret.data.text
  } catch (error) {
    console.error('OCR failed:', error)
    throw error
  }
}
