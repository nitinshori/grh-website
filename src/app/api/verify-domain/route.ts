import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('key') !== 'grh-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    // Trigger domain verification
    const verify = await resend.domains.verify('9c8adc93-c073-4928-b957-b1553e3a9084')

    // Also get domain status
    const domain = await resend.domains.get('9c8adc93-c073-4928-b957-b1553e3a9084')

    return NextResponse.json({ verify, domain })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
