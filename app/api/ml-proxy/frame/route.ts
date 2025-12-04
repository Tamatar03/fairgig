import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import type { FramePayload, FrameResponse, MLResponse, CheatScore } from '@/types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_KEY = process.env.ML_SERVICE_KEY || 'dev-key';
const MAX_FRAME_SIZE = 5 * 1024 * 1024; // 5MB

// Rate limiting map (in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // requests per second
const RATE_WINDOW = 1000; // 1 second

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'AUTH_INVALID', message: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'AUTH_INVALID', message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const payload: FramePayload = await request.json();
    
    if (!payload.sessionId || !payload.studentId || !payload.frame) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate session ownership
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', payload.sessionId)
      .eq('student_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'SESSION_NOT_FOUND', message: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Rate limiting
    const now = Date.now();
    const limitKey = `${payload.sessionId}`;
    const limit = rateLimitMap.get(limitKey);
    
    if (limit) {
      if (now < limit.resetTime) {
        if (limit.count >= RATE_LIMIT) {
          return NextResponse.json(
            { error: 'RATE_LIMIT', message: 'Too many requests' },
            { status: 429 }
          );
        }
        limit.count++;
      } else {
        rateLimitMap.set(limitKey, { count: 1, resetTime: now + RATE_WINDOW });
      }
    } else {
      rateLimitMap.set(limitKey, { count: 1, resetTime: now + RATE_WINDOW });
    }

    // Check frame size
    const frameSize = payload.frame.length;
    if (frameSize > MAX_FRAME_SIZE) {
      return NextResponse.json(
        { error: 'FRAME_TOO_LARGE', message: `Frame size ${frameSize} exceeds limit ${MAX_FRAME_SIZE}` },
        { status: 413 }
      );
    }

    // Forward to ML service
    let mlResponse: MLResponse;
    
    try {
      const mlRes = await fetch(`${ML_SERVICE_URL}/infer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ML_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          sessionId: payload.sessionId,
          sequenceNumber: payload.sequenceNumber,
          timestamp: payload.frameTimestamp,
          frame: payload.frame,
          deviceInfo: payload.deviceInfo,
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!mlRes.ok) {
        throw new Error(`ML service returned ${mlRes.status}`);
      }

      mlResponse = await mlRes.json();
    } catch (mlError) {
      console.error('ML service error:', mlError);
      
      // Return degraded mode response
      mlResponse = {
        focus_score: 0.5,
        confidence: 0,
        alerts: [
          {
            code: 'DEGRADED_MODE' as any,
            severity: 'low' as any,
            description: 'ML service unavailable',
            confidence: 0,
          },
        ],
        metrics: { faces: 0 },
      };

      // Mark session as degraded
      await supabase
        .from('exam_sessions')
        .update({ degraded: true })
        .eq('id', payload.sessionId);
    }

    // Store cheat score
    const scoreData: Omit<CheatScore, 'id'> = {
      session_id: payload.sessionId,
      sequence_number: payload.sequenceNumber,
      timestamp: payload.frameTimestamp,
      focus_score: mlResponse.focus_score,
      confidence: mlResponse.confidence,
      alerts: mlResponse.alerts,
      metrics: mlResponse.metrics,
      server_latency_ms: Date.now() - startTime,
    };

    await supabase.from('cheat_scores').insert(scoreData);

    // Check for high-severity alerts and trigger snapshot saving
    const highSeverityAlerts = mlResponse.alerts.filter(a => a.severity === 'high');
    if (highSeverityAlerts.length > 0) {
      for (const alert of highSeverityAlerts) {
        await supabase.from('suspicious_snapshots').insert({
          session_id: payload.sessionId,
          timestamp: payload.frameTimestamp,
          event_code: alert.code,
          severity: alert.severity,
          storage_path: '', // Will be updated by background job
          ml_confidence: alert.confidence,
          admin_review_status: 'pending',
        });
      }
      
      // TODO: Queue snapshot saving job
    }

    // Construct response
    const response: FrameResponse = {
      ml: mlResponse,
      server: {
        receivedAt: new Date().toISOString(),
        processingMs: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in ml-proxy:', error);
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
