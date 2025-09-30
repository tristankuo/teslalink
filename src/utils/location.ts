export const getUserRegion = (): 'TW' | 'CN' | 'JP' | 'US' | 'EU' | 'AU' | 'KR' | 'Other' => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (timeZone.startsWith('Asia/Taipei')) {
    return 'TW';
  }
  if (timeZone.startsWith('Asia/Shanghai') || timeZone.startsWith('Asia/Chongqing') || timeZone.startsWith('Asia/Urumqi')) {
    return 'CN';
  }
  if (timeZone.startsWith('Asia/Tokyo')) {
    return 'JP';
  }
  if (timeZone.startsWith('America/')) {
    return 'US';
  }
  if (timeZone.startsWith('Europe/')) {
    return 'EU';
  }
  if (timeZone.startsWith('Australia/')) {
    return 'AU';
  }
  if (timeZone.startsWith('Asia/Seoul')) {
    return 'KR';
  }

  return 'Other';
};
