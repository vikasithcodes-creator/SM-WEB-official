import React from 'react';
import { CarouselRole, Product } from '../types';
import { getHeroImage, getProductSrcSet, heroImageSizes } from '../data';

interface CarouselItemProps {
  item: Product;
  index: number;
  role: CarouselRole;
  isMobile: boolean;
  onNavigate: (direction: 'next' | 'prev') => void;
}

export const CarouselItem: React.FC<CarouselItemProps> = ({
  item,
  index,
  role,
  isMobile,
  onNavigate,
}) => {
  const getStyles = (): React.CSSProperties => {
    const baseTransition =
      'transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1), height 650ms cubic-bezier(0.4, 0, 0.2, 1), bottom 650ms cubic-bezier(0.4, 0, 0.2, 1)';

    switch (role) {
      case 'center':
        return {
          transform: `translateX(-50%) scale(${isMobile ? 1.15 : 1.62})`,
          filter: 'none',
          opacity: 1,
          zIndex: 20,
          left: '50%',
          height: isMobile ? '52%' : '84%',
          bottom: isMobile ? '36%' : '4%',
          transition: baseTransition,
          willChange: 'transform, filter, opacity',
        };
      case 'left':
        return {
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(2px)',
          opacity: 0.85,
          zIndex: 10,
          left: isMobile ? '14%' : '26%',
          height: isMobile ? '16%' : '26%',
          bottom: isMobile ? '48%' : '14%',
          transition: baseTransition,
          willChange: 'transform, filter, opacity',
        };
      case 'right':
        return {
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(2px)',
          opacity: 0.85,
          zIndex: 10,
          left: isMobile ? '86%' : '74%',
          height: isMobile ? '16%' : '26%',
          bottom: isMobile ? '48%' : '14%',
          transition: baseTransition,
          willChange: 'transform, filter, opacity',
        };
      case 'back':
        return {
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(4px)',
          opacity: 1,
          zIndex: 5,
          left: '50%',
          height: isMobile ? '12%' : '20%',
          bottom: isMobile ? '48%' : '14%',
          transition: baseTransition,
          willChange: 'transform, filter, opacity',
        };
    }
  };

  const handleClick = () => {
    if (role === 'left') {
      onNavigate('prev');
    } else if (role === 'right') {
      onNavigate('next');
    }
  };

  return (
    <div
      id={`carousel-item-${index}`}
      data-testid={`carousel-item-${index}`}
      data-index={index}
      data-active={role === 'center'}
      data-role={role}
      onClick={handleClick}
      className={`absolute ${
        role !== 'center'
          ? 'cursor-pointer pointer-events-auto'
          : 'pointer-events-none'
      }`}
      style={{
        aspectRatio: '0.6 / 1',
        ...getStyles(),
      }}
      aria-hidden={role !== 'center'}
    >
      <img
        src={getHeroImage(item)}
        srcSet={getProductSrcSet(getHeroImage(item))}
        sizes={heroImageSizes(isMobile)}
        alt={item.name}
        referrerPolicy="no-referrer"
        draggable={false}
        className="select-none pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'bottom center',
        }}
      />
    </div>
  );
};
