import { NextResponse } from 'next/server'

const activities = [
  { message: 'New RFQ received from Lagos seller', status: 'RFQ' },
  { message: 'Bid submitted for container shipment', status: 'Bid' },
  { message: 'KYC package approved for partner', status: 'Seller' },
  { message: 'Shipment milestone updated for exporter', status: 'Exporter' },
  { message: 'Export contract moved to approval', status: 'Contract' }
]

export async function GET() {
  const event = activities[Math.floor(Math.random() * activities.length)]
  return NextResponse.json({ ...event, ts: Date.now() })
}
