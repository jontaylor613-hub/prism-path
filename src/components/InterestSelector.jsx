import React, { useState, useEffect } from 'react';
import { getTheme } from '../utils';

export default function InterestSelector({ selectedInterests = [], onSelectionChange, isDark }) {
  const theme = getTheme(isDark);
  
  const interestCategories = [
    'Working with Hands',
    'Technology',
    'Helping People',
    'Art/Creativity',
    'Outdoors',
    'Science',
    'Business',
    'Sports',
    'Animals',
    'Music',
    'Writing',
    'Math',
    'Construction',
    'Healthcare',
    'Teaching'
  ];

  const [interests, setInterests] = useState(selectedInterests);

  // Sync with parent state changes
  useEffect(() => {
    setInterests(selectedInterests);
  }, [selectedInterests]);

  const handleToggle = (interest) => {
    const newInterests = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest];
    
    setInterests(newInterests);
    if (onSelectionChange) {
      onSelectionChange(newInterests);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {interestCategories.map((category) => {
        const isSelected = interests.includes(category);
        return (
          <button
            key={category}
            onClick={() => handleToggle(category)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${
              isSelected
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30'
                : `${theme.inputBg} border ${theme.inputBorder} ${theme.text} hover:border-fuchsia-400`
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

