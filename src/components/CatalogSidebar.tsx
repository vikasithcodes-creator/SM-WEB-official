import React from 'react';

export interface MinimalCategory {
  id: string;
  name: string;
  targetId: string;
}

interface CatalogSidebarProps {
  categories: MinimalCategory[];
  activeCategory: string;
  onSelectCategory: (cat: MinimalCategory) => void;
  className?: string;
}

export const CatalogSidebar: React.FC<CatalogSidebarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <nav
      id="minimal-catalog-sidebar"
      aria-label="Category navigation"
      className={`w-full select-none ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="text-[11px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-3 px-4">
        Categories
      </div>
      <ul className="space-y-1.5">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <li key={cat.id}>
              <button
                type="button"
                id={`sidebar-category-${cat.id}`}
                onClick={() => onSelectCategory(cat)}
                className={`w-full text-left py-3 px-4 text-[13px] tracking-tight transition-all duration-200 cursor-pointer flex items-center justify-between rounded-xl ${
                  isActive
                    ? 'bg-black text-white font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100 font-medium'
                }`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="whitespace-nowrap">{cat.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-2" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
