import { useState, useEffect } from 'react';

export function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error writing sessionStorage key "${key}":`, error);
    }
  }, [key, value]);

  const remove = () => {
    try {
      window.sessionStorage.removeItem(key);
      setValue(null);
    } catch {
      // Ignored
    }
  };

  return [value, setValue, remove];
}
