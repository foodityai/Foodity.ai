import { format } from 'date-fns';

export function buildContext(profile) {
  // Use provided datetime or fallback to system time
  let dateObj = new Date();
  if (profile.local_time) {
    try {
      dateObj = new Date(profile.local_time);
    } catch (e) {}
  }

  // Format the Date string as YYYY-MM-DD
  const dateStr = format(dateObj, 'yyyy-MM-dd');

  // Time processing
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const timeNum = hours + minutes / 60;

  // Meal type classification
  let meal_type = 'late night';
  if (timeNum >= 5 && timeNum < 10.5) meal_type = 'breakfast';
  else if (timeNum >= 10.5 && timeNum < 12) meal_type = 'morning snack';
  else if (timeNum >= 12 && timeNum < 15.5) meal_type = 'lunch';
  else if (timeNum >= 15.5 && timeNum < 18.5) meal_type = 'evening snack';
  else if (timeNum >= 18.5 && timeNum < 22.5) meal_type = 'dinner';

  return {
    username: profile.username || 'User',
    age: profile.age || 'Not specified',
    gender: profile.gender || 'Not specified',
    height: profile.height || 'Not specified',
    weight: profile.weight || 'Not specified',
    goal: profile.goal || 'Not specified',
    timezone: profile.timezone || 'UTC',
    current_time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    meal_type,
    date: dateStr,
    chat_type: profile.chat_type || 'Conversation',
    ai_mode: profile.ai_mode || 'nutrition',
    enableTimeBased: profile.enableTimeBased !== false,   // default true
    enableSuggestions: profile.enableSuggestions !== false, // default true
  };
}
