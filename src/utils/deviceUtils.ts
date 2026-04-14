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
    
    if (ua.includes("iPad")) {
      deviceName = "iPad";
    } else {
      // iPhone Model Detection via Resolution Mapping
      const width = Math.min(w, h);
      const height = Math.max(w, h);
      
      if (pr === 3) {
        if (width === 430 && height === 932) deviceName = "iPhone 14-16 Pro Max";
        else if (width === 393 && height === 852) deviceName = "iPhone 14-16 Pro / 15-16";
        else if (width === 428 && height === 926) deviceName = "iPhone 12-14 Pro Max";
        else if (width === 390 && height === 844) deviceName = "iPhone 12-14 / Pro";
        else if (width === 375 && height === 812) deviceName = "iPhone X / XS / 11 Pro";
        else if (width === 414 && height === 896) deviceName = "iPhone XS Max / 11 Pro Max";
        else if (width === 414 && height === 736) deviceName = "iPhone 6-8 Plus";
        else if (width === 360 && height === 780) deviceName = "iPhone 12-13 mini";
        else deviceName = "iPhone (Retina)";
      } else if (pr === 2) {
        if (width === 414 && height === 896) deviceName = "iPhone XR / 11";
        else if (width === 375 && height === 667) deviceName = "iPhone 6-8 / SE2-3";
        else if (width === 320 && height === 568) deviceName = "iPhone 5 / SE1";
        else deviceName = "iPhone";
      } else {
        deviceName = "iPhone";
      }
    }
    
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
