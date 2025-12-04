'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { VideoCaptureConfig } from '@/types';

interface VideoCaptureManagerProps {
  config: VideoCaptureConfig;
  onFrameReady: (frameData: string, timestamp: Date) => void;
  onPermissionDenied: () => void;
  onCameraLost: () => void;
  isActive: boolean;
}

export default function VideoCaptureManager({
  config,
  onFrameReady,
  onPermissionDenied,
  onCameraLost,
  isActive,
}: VideoCaptureManagerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    // Set canvas dimensions
    canvas.width = config.frameWidth;
    canvas.height = config.frameHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, config.frameWidth, config.frameHeight);
    
    // Convert to base64 JPEG
    const frameData = canvas.toDataURL('image/jpeg', config.jpegQuality / 100);
    
    // Send frame to parent
    onFrameReady(frameData, new Date());
  }, [config, onFrameReady]);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: config.frameWidth },
          height: { ideal: config.frameHeight },
          facingMode: 'user',
        },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setHasPermission(true);
      setError(null);
      
      // Start capturing frames at configured interval
      intervalRef.current = setInterval(captureFrame, config.frameIntervalMs);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(err instanceof Error ? err.message : 'Camera access denied');
      setHasPermission(false);
      onPermissionDenied();
    }
  }, [config, captureFrame, onPermissionDenied]);

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setHasPermission(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      startCapture();
    } else {
      stopCapture();
    }
    
    return () => {
      stopCapture();
    };
  }, [isActive, startCapture, stopCapture]);

  // Monitor for camera disconnection
  useEffect(() => {
    if (!streamRef.current) return;
    
    const handleEnded = () => {
      console.warn('Camera stream ended');
      onCameraLost();
      stopCapture();
    };
    
    const tracks = streamRef.current.getVideoTracks();
    tracks.forEach(track => {
      track.addEventListener('ended', handleEnded);
    });
    
    return () => {
      tracks.forEach(track => {
        track.removeEventListener('ended', handleEnded);
      });
    };
  }, [hasPermission, onCameraLost, stopCapture]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded">
          <p className="font-semibold">Camera Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {hasPermission && isActive && (
        <div className="flex items-center gap-2 text-success-600 text-sm">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
          <span>Camera active</span>
        </div>
      )}
    </div>
  );
}
