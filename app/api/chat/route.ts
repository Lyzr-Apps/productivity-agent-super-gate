import { NextRequest, NextResponse } from 'next/server'

const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/'
const LYZR_API_KEY = process.env.LYZR_API_KEY || ''
const AGENT_ID = '698e317243d49bda6d7c03a1'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        {
          coaching_advice: 'Please provide a message',
          actionable_steps: [],
          relevant_frameworks: [],
          follow_up_suggestions: [],
        },
        { status: 400 }
      )
    }

    if (!LYZR_API_KEY) {
      return NextResponse.json(
        {
          coaching_advice: 'API key not configured',
          actionable_steps: [],
          relevant_frameworks: [],
          follow_up_suggestions: [],
        },
        { status: 500 }
      )
    }

    const userId = `user-${generateUUID()}`
    const sessionId = `${AGENT_ID}-${generateUUID().substring(0, 12)}`

    const payload = {
      message,
      agent_id: AGENT_ID,
      user_id: userId,
      session_id: sessionId,
    }

    const response = await fetch(LYZR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LYZR_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    const rawText = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        {
          coaching_advice: 'Failed to get response from agent',
          actionable_steps: [],
          relevant_frameworks: [],
          follow_up_suggestions: [],
        },
        { status: response.status }
      )
    }

    // Parse the Lyzr API envelope
    let agentData: any = {}

    try {
      const envelope = JSON.parse(rawText)

      // Agent type is "json", access via result.response.result
      if (envelope?.response?.result) {
        agentData = envelope.response.result
      } else if (envelope?.response) {
        agentData = envelope.response
      } else {
        agentData = envelope
      }
    } catch (error) {
      console.error('Failed to parse agent response:', error)
      return NextResponse.json(
        {
          coaching_advice: 'Failed to parse agent response',
          actionable_steps: [],
          relevant_frameworks: [],
          follow_up_suggestions: [],
        },
        { status: 500 }
      )
    }

    // Extract and validate response fields according to schema
    const cleanResponse = {
      coaching_advice: typeof agentData?.coaching_advice === 'string'
        ? agentData.coaching_advice
        : '',
      actionable_steps: Array.isArray(agentData?.actionable_steps)
        ? agentData.actionable_steps.filter((item: any) => typeof item === 'string')
        : [],
      relevant_frameworks: Array.isArray(agentData?.relevant_frameworks)
        ? agentData.relevant_frameworks.filter((item: any) => typeof item === 'string')
        : [],
      follow_up_suggestions: Array.isArray(agentData?.follow_up_suggestions)
        ? agentData.follow_up_suggestions.filter((item: any) => typeof item === 'string')
        : [],
    }

    return NextResponse.json(cleanResponse)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        coaching_advice: 'Server error occurred',
        actionable_steps: [],
        relevant_frameworks: [],
        follow_up_suggestions: [],
      },
      { status: 500 }
    )
  }
}
