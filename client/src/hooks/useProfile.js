import { useState, useEffect } from 'react';

const DEFAULT_PROFILE = {
  username: 'Valtooy',
  age: '22',
  gender: 'Male',
  height: '175',
  weight: '75',
  goal: 'Maintain',
  region: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  units: 'metric',
  enableTimeBased: true,
  enableSuggestions: true,
  enableChefAnimation: true,
};

export function useProfile() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('foodity_profile');
    if (saved) {
      try {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('foodity_profile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates) => {
    setProfile(p => ({ ...p, ...updates }));
  };

  return { profile, updateProfile };
}
