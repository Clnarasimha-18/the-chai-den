import React from 'react';

interface CategoryIconProps {
  categoryId: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryId,
  className = '',
  size = 18,
}) => {
  const cat = categoryId.toLowerCase();

  // 1. TEA'S: Steaming Hot Tea Cup
  if (cat.includes('tea')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
        <line x1="2" y1="21" x2="18" y2="21" />
      </svg>
    );
  }

  // 2. MILK SHAKES: Soda Fountain Milkshake with Straw & Whipped Top
  if (cat.includes('milkshake') || (cat.includes('shake') && !cat.includes('premium'))) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M7 10h10l-1.5 10a2 2 0 0 1-2 1.8h-3a2 2 0 0 1-2-1.8L7 10Z" />
        <path d="M7 10a5 5 0 0 1 10 0" />
        <path d="M12 2v4" />
        <line x1="15" y1="3" x2="19" y2="1" />
      </svg>
    );
  }

  // 3. PREMIUM SHAKE'S: Golden Crown
  if (cat.includes('premium')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M2 19h20v2H2z" />
        <path d="m2 17 3-11 5 6 4-8 4 8 4-5 1 10H2Z" />
      </svg>
    );
  }

  // 4. FLAVORED MILK'S: Tall Glass with Striped Straw
  if (cat.includes('flavored')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M7 6h10l-1.2 14.2a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8L7 6Z" />
        <path d="M15 2 11 9" />
        <line x1="8" y1="12" x2="16" y2="12" strokeDasharray="1.5 1.5" />
      </svg>
    );
  }

  // 5. MILK'S: Classic Milk Bottle
  if (cat === 'cat_milks' || cat === 'milks' || cat === 'milk') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M9 2h6v3H9z" />
        <path d="M9 5 7 8v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8l-2-3" />
        <line x1="7" y1="13" x2="17" y2="13" />
      </svg>
    );
  }

  // 6. COLD COFFEE'S: Iced Coffee Glass with Cream & Straw
  if (cat.includes('cold_coffee') || (cat.includes('cold') && cat.includes('coffe'))) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M6 9h12l-1.5 11.5a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5L6 9Z" />
        <path d="M6 9c0-2.5 2.5-4 6-4s6 1.5 6 4" />
        <line x1="16" y1="2" x2="13" y2="9" />
      </svg>
    );
  }

  // 7. COFFE'S (HOT): Hot Coffee Cup with Saucer
  if (cat.includes('hot_coffee') || cat.includes('coffe')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v7a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    );
  }

  // 8. COOLER'S & MOJITO'S: Mojito / Highball Glass with Lime Wheel & Straw
  if (cat.includes('cooler') || cat.includes('mojito')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M7 8h10l-1.2 12.5a2 2 0 0 1-2 1.5H10.2a2 2 0 0 1-2-1.5L7 8Z" />
        {/* Lime wheel on rim */}
        <circle cx="8" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="8" cy="7" r="1.5" fill="currentColor" />
        {/* Straw */}
        <line x1="15" y1="2" x2="12" y2="9" strokeWidth="2" />
      </svg>
    );
  }

  // 9. LASSI'S: NEW CHANGED AUTHENTIC TRADITIONAL INDIAN CLAY MATKA / KULHAD LOGO!
  // Handcrafted traditional terracotta clay pot with frothy lassi, saffron sprig, and ethnic banded silhouette
  if (cat.includes('lassi')) {
    return (
      <svg
        width={size + 3}
        height={size + 3}
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <title>Traditional Indian Lassi Matka Logo</title>
        {/* Clay Pot Wide Upper Lip Rim */}
        <ellipse cx="13" cy="7" rx="7.5" ry="2.2" fill="#FFECC7" stroke="currentColor" strokeWidth="1.6" />
        {/* Swirled Frothy Lassi Mound at the top */}
        <path
          d="M8.5 7C8.5 5 10 3.8 13 3.8C16 3.8 17.5 5 17.5 7Z"
          fill="#FFFBF0"
        />
        {/* Saffron & Pistachio Garnish Strands */}
        <path d="M12 4.5 Q13 3.2 14.5 4" stroke="#E59819" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="11.5" cy="5.2" r="0.7" fill="#6E9A34" />
        <circle cx="14.2" cy="5.6" r="0.6" fill="#6E9A34" />

        {/* Earthen Round Belly of the Matka */}
        <path
          d="M6 7.2
             C5.5 8.5 4 11 4 14
             C4 18.5 8 22 13 22
             C18 22 22 18.5 22 14
             C22 11 20.5 8.5 20 7.2"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Flat Sturdy Base of the Clay Pot */}
        <line x1="9.5" y1="22" x2="16.5" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

        {/* Traditional Ethnic Etched Band Rings across the Clay Matka Belly */}
        <path
          d="M5.2 13.5 Q13 16 20.8 13.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M6.5 16.5 Q13 18.8 19.5 16.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="1.5 1.5"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    );
  }

  // Default Fallback
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
};
