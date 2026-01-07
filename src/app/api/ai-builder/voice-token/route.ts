import { NextResponse } from 'next/server';

export async function GET() {
  // Return API keys for voice services
  // In production, these should be temporary tokens with limited scope
  const deepgramKey = process.env.DEEPGRAM_API_KEY || null;
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY || null;

  // Allow partial availability - ElevenLabs TTS can work without Deepgram STT
  // This enables text input with voice output mode
  const hasAnyVoiceService = deepgramKey || elevenlabsKey;

  if (!hasAnyVoiceService) {
    return NextResponse.json(
      {
        error: 'No voice API keys configured',
        deepgramKey: null,
        elevenlabsKey: null,
        sttAvailable: false,
        ttsAvailable: false,
      },
      { status: 503 }
    );
  }

  // In production, you would:
  // 1. Verify user authentication
  // 2. Generate temporary tokens with limited scope
  // 3. Set expiration times

  return NextResponse.json({
    deepgramKey,
    elevenlabsKey,
    sttAvailable: !!deepgramKey,
    ttsAvailable: !!elevenlabsKey,
    expiresAt: Date.now() + 3600000, // 1 hour
  });
}
