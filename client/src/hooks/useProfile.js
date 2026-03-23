import { useState, useEffect } from 'react';
import { auth } from '../firebase';

const DEFAULT_PROFILE = {
  username: '',
  age: '',
  gender: 'Other',
  height: '',
  weight: '',
  goal: '',
  region: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  units: 'metric',
  enableTimeBased: true,
  enableSuggestions: true,
  enableChefAnimation: true,
  isNewUser: true, // Flag to identify if profile needs completion
};

export function useProfile() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('foodity_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If it's a legacy profile (missing isNewUser flag), force it to be "new" and clear defaults
        if (parsed.isNewUser === undefined) {
          return { ...DEFAULT_PROFILE };
        }
        return { ...DEFAULT_PROFILE, ...parsed };
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    
    // Initialize with email prefix if possible
    const user = auth.currentUser;
    if (user && user.email) {
      const emailPrefix = user.email.split('@')[0];
      const capitalized = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      return { ...DEFAULT_PROFILE, username: capitalized };
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
