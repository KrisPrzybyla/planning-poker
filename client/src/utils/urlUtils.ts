// Utility functions for handling invite links and URL parsing

export const getInviteLink = (roomId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/room/${roomId}`;
};

export const getRoomIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/room\/([A-Z0-9]{6})$/);
  return match ? match[1] : null;
};

export const updateUrlForRoom = (roomId: string): void => {
  const newUrl = `/room/${roomId}`;
  window.history.pushState({ roomId }, '', newUrl);
};

export const clearRoomFromUrl = (): void => {
  window.history.pushState({}, '', '/');
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};