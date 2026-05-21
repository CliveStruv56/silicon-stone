declare module 'mammoth' {
  interface MammothInput {
    buffer?: Buffer
    arrayBuffer?: ArrayBuffer
    path?: string
  }

  interface MammothMessage {
    type: string
    message: string
  }

  interface MammothResult {
    value: string
    messages: MammothMessage[]
  }

  export function extractRawText(input: MammothInput): Promise<MammothResult>
  export function convertToHtml(input: MammothInput): Promise<MammothResult>
}
