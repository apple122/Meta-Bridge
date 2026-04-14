/**
 * Robust device detection utility to extract detailed info from Navigator User Agent.
 */

export interface DeviceInfo {
  deviceName: string;
  osName: string;
  browserName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export const getDeviceDetails = (): DeviceInfo => {
  const ua = navigator.userAgent;
  let deviceName = "Unknown Device";
  let osName = "Unknown OS";
  let browserName = "Unknown Browser";
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  const w = window.screen.width;
  const h = window.screen.height;
  const pr = window.devicePixelRatio;

  // 1. Detect Browser
  if (ua.includes("Firefox/")) browserName = "Firefox";
  else if (ua.includes("Edg/")) browserName = "Edge";
  else if (ua.includes("Chrome/")) browserName = "Chrome";
  else if (ua.includes("Safari/")) browserName = "Safari";
  else if (ua.includes("MSIE") || ua.includes("Trident/")) browserName = "Internet Explorer";

  // 2. Detect OS & Device Name
  if (/Android/i.test(ua)) {
    deviceType = 'mobile';
    osName = "Android";
    const osMatch = ua.match(/Android\s([0-9\.]+)/);
    if (osMatch) osName = `Android ${osMatch[1]}`;
    
    // Improved Android Model Detection
    // Typical UA: Mozilla/5.0 (Linux; Android 13; SM-S901B) ...
    const modelMatch = ua.match(/\(([^;]+);\sAndroid[^;]+;\s([^)]+)\)/);
    if (modelMatch) {
      const parts = modelMatch[2].split(';');
      deviceName = parts[parts.length - 1].split(' Build/')[0].trim();
    } else {
      // Fallback for different UA structures
      const genericMatch = ua.match(/Android\s[^;]+;\s([^;)]+)/);
      if (genericMatch) deviceName = genericMatch[1].trim();
      else deviceName = "Android Device";
    }

  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    deviceType = ua.includes("iPad") ? 'tablet' : 'mobile';
    deviceName = ua.includes("iPad") ? "iPad" : "iPhone";
    
    const osVersionMatch = ua.match(/OS\s([0-9_]+)/);
    if (osVersionMatch) osName = `iOS ${osVersionMatch[1].replace(/_/g, '.')}`;
    else osName = "iOS";

  } else if (/Windows/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = "Windows PC";
    if (ua.includes("Windows NT 10.0")) osName = "Windows 10/11";
    else if (ua.includes("Windows NT 6.3")) osName = "Windows 8.1";
    else if (ua.includes("Windows NT 6.2")) osName = "Windows 8";
    else if (ua.includes("Windows NT 6.1")) osName = "Windows 7";
    else osName = "Windows";

  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = 'desktop';
    // Check if it's touch-enabled Mac (could be iPad in desktop mode)
    if (navigator.maxTouchPoints > 0) {
      deviceType = 'tablet';
      deviceName = "iPad";
      osName = "iPadOS";
    } else {
      deviceName = "MacBook / iMac";
      const macMatch = ua.match(/Mac OS X\s([0-9_.]+)/);
      if (macMatch) osName = `macOS ${macMatch[1].replace(/_/g, '.')}`;
      else osName = "macOS";
    }

  } else if (/Linux/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = "Linux PC";
    osName = "Linux";
  }

  return { deviceName, osName, browserName, deviceType };
};
