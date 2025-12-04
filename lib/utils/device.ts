import type { DeviceInfo } from '@/types';

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  return {
    browser: getBrowser(userAgent),
    os: getOS(userAgent),
    deviceType: getDeviceType(userAgent),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}

function getBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
}

function getOS(userAgent: string): string {
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone/i.test(userAgent)) return 'mobile';
  if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

export async function measureNetworkLatency(): Promise<number> {
  const start = performance.now();
  
  try {
    await fetch('/api/health', { method: 'HEAD' });
    return Math.round(performance.now() - start);
  } catch (error) {
    console.error('Error measuring network latency:', error);
    return 0;
  }
}

export function isFullscreenSupported(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );
}

export function requestFullscreen(element: HTMLElement): Promise<void> {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    return (element as any).webkitRequestFullscreen();
  } else if ((element as any).mozRequestFullScreen) {
    return (element as any).mozRequestFullScreen();
  } else if ((element as any).msRequestFullscreen) {
    return (element as any).msRequestFullscreen();
  }
  return Promise.reject('Fullscreen not supported');
}

export function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    return (document as any).webkitExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    return (document as any).mozCancelFullScreen();
  } else if ((document as any).msExitFullscreen) {
    return (document as any).msExitFullscreen();
  }
  return Promise.reject('Fullscreen not supported');
}

export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

export function detectDevTools(): boolean {
  // Best-effort detection - not foolproof
  const threshold = 160;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;
  return widthThreshold || heightThreshold;
}

export function preventCopyPaste() {
  const handler = (e: Event) => {
    e.preventDefault();
    return false;
  };
  
  document.addEventListener('copy', handler);
  document.addEventListener('cut', handler);
  document.addEventListener('paste', handler);
  
  return () => {
    document.removeEventListener('copy', handler);
    document.removeEventListener('cut', handler);
    document.removeEventListener('paste', handler);
  };
}

export function preventContextMenu() {
  const handler = (e: Event) => {
    e.preventDefault();
    return false;
  };
  
  document.addEventListener('contextmenu', handler);
  
  return () => {
    document.removeEventListener('contextmenu', handler);
  };
}
