import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, session_id } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Make request to Python backend for chat processing
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: session_id || 'default',
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      response: data.response,
      session_id: data.session_id,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json({
      response: "I'm your BugHuntr Assistant! I can help you with:\n\n• Navigating the BugHuntr platform\n• Understanding cybersecurity concepts\n• Bug bounty hunting tips\n• Code examples and Firebase integration\n• Platform features and functionality\n\nWhat would you like to know?",
      session_id: 'error-session',
    }, { status: 200 });
  }
}