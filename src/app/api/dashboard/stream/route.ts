export const dynamic = 'force-dynamic'

const activities = [
  'New RFQ received from Lagos supplier.',
  'Compliance team approved pending export documents.',
  'Buyer submitted a contract extension request.',
  'Shipment ETA updated to tomorrow morning.',
  'Analytics report finished generating.',
  'New message from your logistics partner.',
  'Supplier bid response arrived for review.'
]

function createEventPayload(message: string) {
  return `data: ${JSON.stringify({ message, ts: Date.now() })}\n\n`
}

export async function GET() {
  const encoder = new TextEncoder()

  let interval: NodeJS.Timeout | null = null
  let keepAlive: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('retry: 15000\n\n'))
      controller.enqueue(encoder.encode(createEventPayload('Dashboard live stream connected.')))

      let counter = 0
      interval = setInterval(() => {
        const message = activities[counter % activities.length]
        controller.enqueue(encoder.encode(createEventPayload(message)))
        counter += 1
      }, 5000)

      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(':\n\n'))
      }, 15000)
    },
    cancel() {
      if (interval) clearInterval(interval)
      if (keepAlive) clearInterval(keepAlive)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  })
}
