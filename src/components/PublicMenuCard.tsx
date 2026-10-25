import React, { useState, useEffect } from 'react';
import { Category, MenuItem } from '../types';
import { QrCode, Lock, X, Github, Linkedin, Mail } from 'lucide-react';
import { ChaiDenLogo } from './ChaiDenLogo';
import { ChaiMugHero } from './ChaiMugHero';
import { CategoryIcon } from './CategoryIcon';
import { MilkshakesTallGlass, MilkshakesRowMini } from './MilkshakesVisual';

interface PublicMenuCardProps {
  categories: Category[];
  menuItems: MenuItem[];
  onOpenOwnerLogin: () => void;
  onOpenQrModal: () => void;
}

export const PublicMenuCard: React.FC<PublicMenuCardProps> = ({
  categories,
  menuItems: propMenuItems,
  onOpenOwnerLogin,
  onOpenQrModal,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [liveMenuItems, setLiveMenuItems] = useState<MenuItem[]>(propMenuItems);
  const [recentlyUpdatedPriceId] = useState<string | null>(null);

  // Sync propMenuItems into liveMenuItems
  useEffect(() => {
    setLiveMenuItems(propMenuItems);
  }, [propMenuItems]);

  // Real-time listener for zero-latency local / cross-tab price updates
  useEffect(() => {
    const handleItemsChanged = (e: Event) => {
      const custom = e as CustomEvent<MenuItem[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setLiveMenuItems(custom.detail);
      }
    };

    window.addEventListener('chaiden_items_changed', handleItemsChanged);
    return () => {
      window.removeEventListener('chaiden_items_changed', handleItemsChanged);
    };
  }, []);

  // Filter and sort active categories
  const filteredCategories = categories
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Robust category matching for 3 columns matching physical menu card
  const isCategoryMatch = (cat: Category, targetKey: string): boolean => {
    const id = (cat.id || '').toLowerCase();
    const name = (cat.name || '').toUpperCase();

    switch (targetKey) {
      case 'teas':
        return id.includes('tea') || (name.includes('TEA') && !name.includes('GREEN'));
      case 'flavored_milks':
        return id.includes('flavored') || name.includes('FLAVORED');
      case 'hot_coffees':
        return (
          id.includes('hot_coffee') ||
          (name.includes('COFFE') && name.includes('HOT')) ||
          name === "COFFE'S (HOT)" ||
          name === "COFFEE'S (HOT)"
        );
      case 'milkshakes':
        return (
          (id.includes('milkshake') || name.includes('SHAKE')) &&
          !id.includes('premium') &&
          !name.includes('PREMIUM')
        );
      case 'milks':
        return (
          (id === 'cat_milks' || name === "MILK'S" || name === 'MILKS' || name === 'MILK') &&
          !id.includes('flavored') &&
          !name.includes('FLAVORED')
        );
      case 'coolers':
        return id.includes('cooler') || name.includes('COOLER') || name.includes('MOJITO');
      case 'premium_shakes':
        return id.includes('premium') || name.includes('PREMIUM');
      case 'cold_coffees':
        return id.includes('cold_coffee') || name.includes('COLD');
      case 'lassis':
        return id.includes('lassi') || name.includes('LASSI');
      default:
        return false;
    }
  };

  // Group categories into 3 columns matching physical menu card layout
  const col1Categories = filteredCategories.filter((c) =>
    ['teas', 'flavored_milks', 'hot_coffees'].some((k) => isCategoryMatch(c, k))
  );
  const col2Categories = filteredCategories.filter((c) =>
    ['milkshakes', 'milks', 'coolers'].some((k) => isCategoryMatch(c, k))
  );
  const col3Categories = filteredCategories.filter((c) =>
    ['premium_shakes', 'cold_coffees', 'lassis'].some((k) => isCategoryMatch(c, k))
  );

  // Catch any unassigned categories so none are ever lost
  const assignedIds = new Set([
    ...col1Categories.map((c) => c.id),
    ...col2Categories.map((c) => c.id),
    ...col3Categories.map((c) => c.id),
  ]);
  const unassigned = filteredCategories.filter((c) => !assignedIds.has(c.id));
  unassigned.forEach((cat, idx) => {
    if (idx % 3 === 0) col1Categories.push(cat);
    else if (idx % 3 === 1) col2Categories.push(cat);
    else col3Categories.push(cat);
  });

  // Category specific banner graphics positioned at bottom of each card (exact to physical menu)
  const categoryFooterImages: Record<string, { image: string; alt: string }> = {
    cat_flavored_milks: {
      image: '/images/flavored_milks.jpg',
      alt: "Flavored Milk's",
    },
    cat_hot_coffees: {
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      alt: "Coffe's (Hot)",
    },
    cat_milks: {
      image: '/images/spiced_milks.jpg',
      alt: "Milk's",
    },
    cat_coolers: {
      image: '/images/coolers.jpg',
      alt: "Cooler's & Mojito's",
    },
    cat_premium_shakes: {
      image: '/images/premium_shakes.jpg',
      alt: "Premium Shake's",
    },
    cat_cold_coffees: {
      image: '/images/cold_coffees.jpg',
      alt: "Cold Coffee's",
    },
    cat_lassis: {
      image: '/images/lassis.jpg',
      alt: "Lassi's",
    },
  };

  /**
   * Robust items lookup:
   * First by exact categoryId; if none found, by category key matching
   */
  const getItemsForCategory = (cat: Category): MenuItem[] => {
    let items = liveMenuItems.filter(
      (item) => item.active !== false && item.categoryId === cat.id
    );

    if (items.length === 0) {
      const allCategoryKeys = [
        'teas',
        'milkshakes',
        'premium_shakes',
        'flavored_milks',
        'milks',
        'cold_coffees',
        'hot_coffees',
        'coolers',
        'lassis',
      ];
      const matchedKey = allCategoryKeys.find((k) => isCategoryMatch(cat, k));
      if (matchedKey) {
        items = liveMenuItems.filter(
          (item) =>
            item.active !== false &&
            (item.categoryId === `cat_${matchedKey}` ||
              item.categoryId.toLowerCase().includes(matchedKey) ||
              (matchedKey === 'hot_coffees' &&
                (item.categoryId === 'cat_hot_coffees' ||
                  (item.categoryId.includes('coffee') && !item.categoryId.includes('cold')))) ||
              (matchedKey === 'teas' && item.categoryId.includes('tea')))
        );
      }
    }

    return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  };

  const renderCategoryCard = (cat: Category) => {
    const rawItems = getItemsForCategory(cat);

    if (activeCategoryFilter !== 'all' && activeCategoryFilter !== cat.id) {
      return null;
    }

    const isTeas = isCategoryMatch(cat, 'teas');
    const isMilkshakes = isCategoryMatch(cat, 'milkshakes');
    const isPremiumShakes = isCategoryMatch(cat, 'premium_shakes');

    // Exclude Muska Bun from the numbered TEA'S list (rendered in dedicated hero callout)
    const items = rawItems.filter((i) => {
      if (isTeas && (i.id.includes('maskabun') || i.name.toLowerCase().includes('maska') || i.name.toLowerCase().includes('muska'))) {
        return false;
      }
      return true;
    });

    return (
      <div
        key={cat.id}
        id={`cat-section-${cat.id}`}
        className="relative bg-[#130703]/95 border border-[#dfb76c]/40 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#dfb76c]/80 flex flex-col justify-between"
      >
        {/* Subtle corner gold brackets */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-[#dfb76c] pointer-events-none z-10" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-[#dfb76c] pointer-events-none z-10" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-[#dfb76c] pointer-events-none z-10" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-[#dfb76c] pointer-events-none z-10" />

        {/* Category Header Ribbon with Category Logo (Includes NEW changed Lassi Matka logo) */}
        <div
          className="relative px-3 py-1.5 flex items-center justify-center gap-2 border-b border-[#dfb76c]/30 shadow-md"
          style={{ backgroundColor: cat.color || '#8C4307' }}
        >
          <CategoryIcon
            categoryId={cat.id}
            size={18}
            className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex-shrink-0"
          />
          <h3 className="font-cinzel text-base md:text-lg font-bold tracking-widest text-[#fff] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center">
            {cat.name}
          </h3>
        </div>

        {/* Card Main Body */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          {/* MILK SHAKES SPECIAL LAYOUT: Tall Strawberry Milkshake Glass on Left + Items on Right */}
          {isMilkshakes ? (
            <div className="flex items-start gap-2">
              {/* Left Column: Tall Strawberry Milkshake Glass with whipped cream & straw */}
              <div className="flex-shrink-0 pt-1">
                <MilkshakesTallGlass />
              </div>

              {/* Right Column: 8 Milkshake Items */}
              <div className="flex-1 space-y-1 min-w-0">
                {items.map((item) => {
                  // Extract leading number and strip dot/dash
                  const match = item.name.match(/^(\d+)[.\s-]*(.*)$/);
                  const num = match ? match[1] : '';
                  const restName = match ? match[2].trim() : item.name;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="group/item flex items-baseline justify-between cursor-pointer py-0.5 px-1 rounded transition-colors hover:bg-[#c59b41]/15"
                      title="Click to view item"
                    >
                      <div className="flex items-baseline gap-1.5 min-w-0 pr-1">
                        {num && (
                          <span className="w-4 h-4 rounded-full bg-[#E06287] text-white text-[10.5px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm leading-none">
                            {num}
                          </span>
                        )}
                        <span className="font-outfit font-medium text-[13px] sm:text-[13.5px] leading-tight text-[#fbf6ed] group-hover/item:text-[#dfb76c] transition-colors truncate">
                          {restName}
                        </span>
                      </div>
                      <span className="dotted-leader opacity-35 group-hover/item:opacity-75 transition-opacity" />
                      <div className="flex items-baseline flex-shrink-0 pl-1">
                        <span className="font-cinzel font-bold text-[13px] sm:text-[13.5px] text-[#f4d068] tracking-tight">
                          {item.price}/-
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STANDARD ITEM LIST FOR ALL OTHER CATEGORIES */
            <div className="space-y-1.5">
              {items.map((item) => {
                // If Premium Shakes, format number in golden circle badge without dot
                if (isPremiumShakes) {
                  const match = item.name.match(/^(\d+)[.\s-]*(.*)$/);
                  const num = match ? match[1] : '';
                  const restName = match ? match[2].trim() : item.name;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="group/item flex items-baseline justify-between cursor-pointer py-0.5 px-1 rounded transition-colors hover:bg-[#c59b41]/15"
                      title="Click to view item"
                    >
                      <div className="flex items-baseline gap-1.5 min-w-0 pr-1">
                        {num && (
                          <span className="w-4 h-4 rounded-full bg-[#C79836] text-[#130703] text-[10.5px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm leading-none">
                            {num}
                          </span>
                        )}
                        <span className="font-outfit font-medium text-[13.5px] sm:text-[14px] leading-tight text-[#fbf6ed] group-hover/item:text-[#dfb76c] transition-colors truncate">
                          {restName}
                        </span>
                      </div>
                      <span className="dotted-leader opacity-35 group-hover/item:opacity-75 transition-opacity" />
                      <div className="flex items-baseline flex-shrink-0 pl-1">
                        <span className="font-cinzel font-bold text-[13.5px] sm:text-[14px] text-[#f4d068] tracking-tight">
                          {item.price}/-
                        </span>
                      </div>
                    </div>
                  );
                }

                // Regular Categories: Ensure Ilachi spelling if item_t3
                let displayName = item.name;
                if (item.id === 'item_t3' || displayName.toLowerCase().includes('elachi tea')) {
                  displayName = '3. Ilachi Tea';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="group/item flex items-baseline justify-between cursor-pointer py-0.5 px-1 rounded transition-colors hover:bg-[#c59b41]/15"
                    title="Click to view item"
                  >
                    <div className="flex items-baseline gap-1.5 min-w-0 pr-1">
                      {item.isNew && (
                        <span className="text-[8px] font-black font-outfit uppercase px-1 py-0.2 text-white bg-red-600 rounded-[2px] shadow-sm flex-shrink-0">
                          NEW
                        </span>
                      )}
                      <span className="font-outfit font-medium text-[13.5px] sm:text-[14px] leading-tight text-[#fbf6ed] group-hover/item:text-[#dfb76c] transition-colors truncate">
                        {displayName}
                      </span>
                    </div>

                    <span className="dotted-leader opacity-35 group-hover/item:opacity-75 transition-opacity" />

                    <div className="flex items-baseline flex-shrink-0 pl-1">
                      <span
                        className={`font-cinzel font-bold text-[13.5px] sm:text-[14px] text-[#f4d068] group-hover/item:scale-105 transition-all tracking-tight ${
                          recentlyUpdatedPriceId === item.id
                            ? 'text-emerald-400 scale-110 font-black'
                            : ''
                        }`}
                      >
                        {item.price}/-
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Inset Callout inside TEA'S: "Muska Bun with Chai ♡" (No description per request) */}
          {isTeas && (() => {
            const maskaBunItem = liveMenuItems.find((i) =>
              i.name.toLowerCase().includes('muska bun') || i.name.toLowerCase().includes('maska bun')
            );
            const maskaPrice = maskaBunItem ? maskaBunItem.price : 50;

            return (
              <div className="mt-3 pt-2 border-t border-[#dfb76c]/30">
                <div
                  onClick={() => maskaBunItem && setSelectedItem(maskaBunItem)}
                  className="bg-[#1c0d06] border border-[#dfb76c]/60 rounded-xl p-2 flex items-center justify-between gap-2 shadow-lg cursor-pointer hover:border-[#dfb76c] transition-colors"
                  title="Click to view details"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#dfb76c] flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=250&q=80"
                        alt="Muska Bun with Chai"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="font-cormorant italic text-base sm:text-lg font-bold text-[#fce09b] block leading-tight">
                        Muska Bun with Chai ♡
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="font-cinzel font-black text-sm sm:text-base text-white bg-red-600 px-3 py-1 rounded-full shadow-md">
                      {maskaPrice}/-
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* BOTTOM VISUAL SECTION FOR EACH CATEGORY (EXACT MATCH TO PHYSICAL MENU CARD) */}
        {/* 1. For MILK SHAKES: 6 Mini Milkshakes row at the bottom */}
        {isMilkshakes && (
          <div className="px-2 pt-1 pb-2 border-t border-[#dfb76c]/20 bg-[#0e0402]/60">
            <MilkshakesRowMini />
          </div>
        )}

        {/* 2. For Other Categories with Bottom Banner Graphics */}
        {!isTeas && !isMilkshakes && (categoryFooterImages[cat.id] || cat.image) && (
          <div className="px-3 pb-2.5 pt-1">
            <div className="relative w-full h-24 sm:h-28 rounded-lg overflow-hidden border border-[#dfb76c]/40 shadow-inner group/img">
              <img
                src={categoryFooterImages[cat.id]?.image || cat.image}
                alt={categoryFooterImages[cat.id]?.alt || cat.name}
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#130703]/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0e0603] text-[#f5efe6] selection:bg-[#c59b41]/30">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-30 bg-[#140703]/95 backdrop-blur-md border-b border-[#dfb76c]/30 px-3 py-2 sm:px-6 shadow-xl no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Cafe Identity with Authentic Chai Den Logo */}
          <div className="flex items-center gap-2.5">
            <ChaiDenLogo size="sm" showSubtitle={false} />
            <div>
              <span className="font-cinzel text-sm sm:text-base font-extrabold tracking-wider text-gold-gradient block leading-none">
                THE CHAI DEN
              </span>
              <span className="text-[9px] tracking-widest text-[#dfb76c]/80 uppercase block font-outfit mt-0.5">
                PREMIUM CAFE • DIGITAL MENU
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQrModal}
              title="Show Table QR"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e0e07] border border-[#dfb76c]/40 text-xs font-outfit font-medium text-[#f5efe6] hover:bg-[#2d160b] hover:border-[#dfb76c] transition-all shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span className="hidden sm:inline">Table QR</span>
            </button>

            <button
              onClick={onOpenOwnerLogin}
              title="Owner & Staff Login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e0e07] border border-[#dfb76c]/40 text-xs font-outfit text-[#dfb76c] hover:bg-[#2d160b] hover:border-[#dfb76c] transition-all"
            >
              <Lock className="w-3 h-3" />
              <span>Owner Login</span>
            </button>
          </div>
        </div>

        {/* Quick Category Tabs Bar */}
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-outfit uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeCategoryFilter === 'all'
                ? 'bg-[#dfb76c] text-[#1c0e07] font-bold border-[#dfb76c] shadow-[0_0_12px_rgba(223,183,108,0.4)]'
                : 'bg-[#1e0e07] text-[#dfb76c]/80 border-[#dfb76c]/30 hover:border-[#dfb76c]'
            }`}
          >
            All Menu
          </button>
          {filteredCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCategoryFilter(c.id);
                const el = document.getElementById(`cat-section-${c.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-outfit tracking-wide whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                activeCategoryFilter === c.id
                  ? 'bg-[#dfb76c] text-[#1c0e07] font-bold border-[#dfb76c] shadow-[0_0_12px_rgba(223,183,108,0.4)]'
                  : 'bg-[#1e0e07] text-[#dfb76c]/80 border-[#dfb76c]/30 hover:border-[#dfb76c]'
              }`}
            >
              <CategoryIcon categoryId={c.id} size={13} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTAINER: EXACT PHYSICAL CHAI DEN MENU CARD REPRODUCTION */}
      {/* ======================================================== */}
      <main className="p-2 sm:p-5 md:p-7 flex justify-center">
        <div className="w-full max-w-[1240px] bg-[#120703] border-[3px] border-[#c59b41] rounded-2xl p-3 sm:p-6 md:p-8 shadow-[0_12px_60px_rgba(0,0,0,0.95),0_0_45px_rgba(223,183,108,0.18)] relative overflow-hidden">
          {/* Subtle gold double borders */}
          <div className="absolute inset-2 sm:inset-3 border border-[#dfb76c]/30 rounded-xl pointer-events-none" />
          <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-[#dfb76c] pointer-events-none" />
          <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-[#dfb76c] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-[#dfb76c] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-[#dfb76c] pointer-events-none" />

          {/* ======================================================== */}
          {/* 1. TOP HEADER SECTION (EXACT TO PHYSICAL MENU CARD)       */}
          {/* ======================================================== */}
          <div className="relative z-10 pt-2 pb-6 border-b border-[#dfb76c]/40">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 px-1 sm:px-3">
              {/* Left Column: Authentic Chai Den Circular Emblem Logo with Filigree */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-shrink-0">
                <ChaiDenLogo size="xl" showSubtitle={true} />
              </div>

              {/* Center Column: Tagline in Cursive Calligraphy (Exact to menu image) */}
              <div className="flex flex-col items-center justify-center text-center my-1 lg:my-0">
                <p className="font-cormorant italic text-3xl sm:text-4xl text-[#fde68a] font-semibold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  Sip Happiness,
                </p>
                <p className="font-cormorant italic text-2xl sm:text-3xl text-[#f5ebd8] leading-tight flex items-center justify-center gap-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mt-0.5">
                  <span>Live Every Moment</span>
                  <span className="text-red-400 font-serif text-2xl">♡</span>
                </p>
              </div>

              {/* Right Column: Steaming Terracotta Chai Mug with Whole Spices */}
              <div className="flex items-center justify-center lg:justify-end flex-shrink-0">
                <ChaiMugHero size="lg" />
              </div>
            </div>

            {/* Central "MENU" Badge Ribbon (Exact to physical card) */}
            <div className="flex justify-center -mb-10 mt-4 relative z-20">
              <div className="bg-[#b3541e] border-2 border-[#f5e29f] px-9 py-1 rounded-md shadow-2xl">
                <h2 className="font-cinzel text-xl sm:text-2xl font-black tracking-[0.2em] text-[#fff] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  MENU
                </h2>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. THE 3-COLUMN PHYSICAL CARD BODY                         */}
          {/* ======================================================== */}
          <div className="relative z-10 mt-9">
            {activeCategoryFilter !== 'all' ? (
              <div className="max-w-xl mx-auto space-y-5">
                {filteredCategories.map(renderCategoryCard)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 items-start">
                {/* Column 1: TEA'S, FLAVORED MILK'S, COFFE'S (HOT) */}
                <div className="space-y-4">
                  {col1Categories.map(renderCategoryCard)}
                </div>

                {/* Column 2: MILK SHAKES, MILK'S, COOLER'S & MOJITO'S */}
                <div className="space-y-4">
                  {col2Categories.map(renderCategoryCard)}
                </div>

                {/* Column 3: PREMIUM SHAKE'S, COLD COFFEE'S, LASSI'S */}
                <div className="space-y-4">
                  {col3Categories.map(renderCategoryCard)}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 3. BOTTOM SECTION (EXACT TO PHYSICAL MENU CARD)           */}
          {/* ======================================================== */}
          <div className="relative z-10 mt-8 pt-5 border-t border-[#dfb76c]/40 text-center">
            {/* GOOD DRINKS • GOOD TIMES • GREAT MEMORIES */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-cinzel font-bold tracking-[0.18em] text-[#f5e29f] uppercase">
              <span className="flex items-center gap-1.5">
                <span>☕</span>
                <span>GOOD DRINKS</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span>😊</span>
                <span>GOOD TIMES</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span>❤️</span>
                <span>GREAT MEMORIES</span>
              </span>
            </div>

            {/* THANK YOU! VISIT AGAIN Badge */}
            <div className="inline-block mt-3 bg-[#b3541e] border-2 border-[#dfb76c] px-6 py-1 rounded-md shadow-lg">
              <span className="font-cinzel text-xs sm:text-sm font-black tracking-widest text-white uppercase">
                THANK YOU! VISIT AGAIN
              </span>
            </div>

            {/* Developer Details & Contact Credits */}
            <div className="mt-8 pt-6 border-t border-[#dfb76c]/30 text-center">
              <div className="inline-flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#1a0c05]/95 to-[#100602]/95 border border-[#dfb76c]/40 shadow-[0_6px_25px_rgba(0,0,0,0.7)] max-w-lg mx-auto">
                <span className="text-[10px] font-outfit uppercase tracking-[3px] text-[#dfb76c]/70 font-semibold mb-1">
                  Developer & Creator
                </span>
                <h4 className="font-cinzel text-base sm:text-lg font-bold text-gold-gradient tracking-wide">
                  C Lakshmi Narasimha
                </h4>
                <p className="text-xs text-[#eedfca] font-outfit mt-0.5 tracking-wide">
                  student of iare | web developer
                </p>

                {/* Social and Contact Links with Logos */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3 pt-3 border-t border-[#dfb76c]/20 w-full">
                  <a
                    href="https://github.com/Clnarasimha-18"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub Profile"
                    title="github: https://github.com/Clnarasimha-18"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#240f06] border border-[#dfb76c]/40 text-[#f5e29f] hover:bg-[#38180a] hover:border-[#dfb76c] hover:text-white transition-all text-[11.5px] font-outfit font-medium shadow-sm group"
                  >
                    <Github className="w-3.5 h-3.5 text-[#dfb76c] group-hover:scale-110 transition-transform" />
                    <span>GitHub</span>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/c-lakshmi-narasimha-453392385/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn Profile"
                    title="linkedin: https://www.linkedin.com/in/c-lakshmi-narasimha-453392385/"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#240f06] border border-[#dfb76c]/40 text-[#f5e29f] hover:bg-[#38180a] hover:border-[#dfb76c] hover:text-white transition-all text-[11.5px] font-outfit font-medium shadow-sm group"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-[#dfb76c] group-hover:scale-110 transition-transform" />
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="mailto:clnarasimha08@gmail.com"
                    aria-label="Email Contact"
                    title="gmail to contact: clnarasimha08@gmail.com"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#240f06] border border-[#dfb76c]/40 text-[#f5e29f] hover:bg-[#38180a] hover:border-[#dfb76c] hover:text-white transition-all text-[11.5px] font-outfit font-medium shadow-sm group"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#dfb76c] group-hover:scale-110 transition-transform" />
                    <span>clnarasimha08@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Item Quick-Detail Modal (Description Removed Completely as Requested) */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-sm bg-[#160a04] border-2 border-[#dfb76c] rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/60 text-[#dfb76c] hover:bg-black/90 flex items-center justify-center border border-[#dfb76c]/40 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {selectedItem.image && (
              <div className="w-full h-44 bg-black relative">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#160a04] via-transparent to-transparent" />
                {selectedItem.isNew && (
                  <span className="absolute bottom-2 left-3 text-[10px] font-bold font-outfit uppercase px-2 py-0.5 text-white bg-red-600 rounded">
                    NEW ON MENU
                  </span>
                )}
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#fff4db]">
                    {selectedItem.name}
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-outfit uppercase tracking-wider block mt-0.5">
                    100% Vegetarian
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-cinzel text-xl font-black text-[#f4d068]">
                    {selectedItem.price}/-
                  </span>
                </div>
              </div>

              {/* Note: Descriptions removed per user requirement */}

              <div className="mt-4 pt-3 border-t border-[#dfb76c]/30 flex justify-between items-center text-xs text-[#dfb76c]/80 font-outfit">
                <span>The Chai Den Recipe</span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1 rounded-full bg-[#dfb76c] text-[#1c0e07] font-bold hover:bg-[#edd085] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
