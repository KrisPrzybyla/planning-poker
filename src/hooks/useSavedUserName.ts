import { useEffect, useState } from 'react';

const STORAGE_KEY = 'planningPoker_userName';

// Remembers the last name a user typed into Create/Join forms, across rooms
// and browser sessions, so they don't have to retype it every time.
export const useSavedUserName = () => {
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  useEffect(() => {
    if (userName.trim()) {
      localStorage.setItem(STORAGE_KEY, userName);
    }
  }, [userName]);

  return [userName, setUserName] as const;
};
