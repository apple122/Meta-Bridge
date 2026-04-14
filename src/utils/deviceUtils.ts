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


  // 1. Detect Browser
  if (ua.includes("Firefox/")) browserName = "Firefox";
  else if (ua.includes("Edg/")) browserName = "Edge";
  else if (ua.includes("Chrome/")) browserName = "Chrome";
  else if (ua.includes("Safari/")) browserName = "Safari";
  else if (ua.includes("MSIE") || ua.includes("Trident/")) browserName = "Internet Explorer";

  // 2. Detect OS & Device Name
  if (/Android/i.test(ua)) {
    deviceType = 'mobile';
    deviceName = "มือถือ (Android)";
    osName = "Android";

  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    deviceType = ua.includes("iPad") ? 'tablet' : 'mobile';
    deviceName = ua.includes("iPad") ? "iPad" : "iPhone";
    osName = "iOS";

  } else if (/Windows/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = "คอมพิวเตอร์ (Windows)";
    osName = "Windows";

  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = 'desktop';
    // Check if it's touch-enabled Mac (could be iPad in desktop mode)
    if (navigator.maxTouchPoints > 0) {
      deviceType = 'tablet';
      deviceName = "iPad";
      osName = "iPadOS";
    } else {
      deviceName = "คอมพิวเตอร์ (Mac)";
      osName = "macOS";
    }

  } else if (/Linux/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = "คอมพิวเตอร์ (Linux)";
    osName = "Linux";
  }

  return { deviceName, osName, browserName, deviceType };
};
