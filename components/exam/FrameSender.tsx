'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import type { FramePayload, FrameResponse, DeviceInfo, LocalChecks } from '@/types';
import { getDeviceInfo } from '@/lib/utils/device';
import { saveFrame } from '@/lib/utils/storage';

interface FrameSenderProps {
  sessionId: string;
  studentId: string;
  onResponse: (response: FrameResponse) => void;
  onError: (error: Error) => void;
  isActive: boolean;
}

interface QueuedFrame {
  payload: FramePayload;
  retries: number;
}

const MAX_QUEUE_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export default function FrameSender({
  sessionId,
  studentId,
  onResponse,
  onError,
  isActive,
}: FrameSenderProps) {
  const [sequenceNumber, setSequenceNumber] = useState(0);
  const [queueSize, setQueueSize] = useState(0);
  const queueRef = useRef<QueuedFrame[]>([]);
  const processingRef = useRef(false);
  const deviceInfoRef = useRef<DeviceInfo>(getDeviceInfo());

  const getLocalChecks = useCallback((): LocalChecks => {
    return {
      visibilityState: document.visibilityState,
      isFullscreen: !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      ),
      tabFocus: document.hasFocus(),
    };
  }, []);

  const sendFrame = useCallback(async (payload: FramePayload): Promise<FrameResponse> => {
    const response = await fetch('/api/ml-proxy/frame', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    
    processingRef.current = true;
    
    while (queueRef.current.length > 0) {
      const item = queueRef.current[0];
      
      try {
        const response = await sendFrame(item.payload);
        onResponse(response);
        
        // Remove successful item from queue
        queueRef.current.shift();
        setQueueSize(queueRef.current.length);
      } catch (error) {
        console.error('Error sending frame:', error);
        
        if (item.retries < MAX_RETRIES) {
          // Retry
          item.retries++;
          queueRef.current[0] = item;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * item.retries));
        } else {
          // Max retries exceeded, save to IndexedDB and remove from queue
          await saveFrame(
            item.payload.sessionId,
            item.payload.sequenceNumber,
            item.payload.frame
          );
          
          queueRef.current.shift();
          setQueueSize(queueRef.current.length);
          onError(new Error(`Failed to send frame ${item.payload.sequenceNumber} after ${MAX_RETRIES} retries`));
        }
      }
    }
    
    processingRef.current = false;
  }, [sendFrame, onResponse, onError]);

  const enqueueFrame = useCallback((frameData: string, timestamp: Date) => {
    if (!isActive) return;
    
    const payload: FramePayload = {
      sessionId,
      studentId,
      sequenceNumber: sequenceNumber,
      frameTimestamp: timestamp.toISOString(),
      frame: frameData,
      deviceInfo: deviceInfoRef.current,
      localChecks: getLocalChecks(),
    };
    
    // Update sequence number
    setSequenceNumber(prev => prev + 1);
    
    // Check queue size limit
    if (queueRef.current.length >= MAX_QUEUE_SIZE) {
      console.warn('Frame queue full, dropping oldest frame');
      queueRef.current.shift();
    }
    
    queueRef.current.push({
      payload,
      retries: 0,
    });
    
    setQueueSize(queueRef.current.length);
    
    // Start processing if not already running
    processQueue();
  }, [sessionId, studentId, sequenceNumber, isActive, getLocalChecks, processQueue]);

  // Expose enqueueFrame to parent via ref or props
  useEffect(() => {
    // Store the function reference for external use if needed
    (window as any).__enqueueFrame = enqueueFrame;
    
    return () => {
      delete (window as any).__enqueueFrame;
    };
  }, [enqueueFrame]);

  return (
    <div className="text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <span>Queue: {queueSize}</span>
        <span>|</span>
        <span>Frames sent: {sequenceNumber}</span>
        {queueSize > 10 && (
          <>
            <span>|</span>
            <span className="text-warning-600">High queue size</span>
          </>
        )}
      </div>
    </div>
  );
}

// Export the enqueue function type for parent components
export type EnqueueFrameFunction = (frameData: string, timestamp: Date) => void;
