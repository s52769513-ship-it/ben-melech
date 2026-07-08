import { useEffect, useRef, useState, useCallback } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialLoad?: number;
}

export function useInfiniteScroll<T>(
  allItems: T[],
  itemsPerLoad: number = 50,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 200, initialLoad = itemsPerLoad } = options;

  const [displayedCount, setDisplayedCount] = useState(initialLoad);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCount < allItems.length) {
          setDisplayedCount((prev) => Math.min(prev + itemsPerLoad, allItems.length));
        }
      },
      { rootMargin: `${threshold}px` }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [displayedCount, allItems.length, itemsPerLoad, threshold]);

  const displayedItems = allItems.slice(0, displayedCount);
  const hasMore = displayedCount < allItems.length;

  return {
    displayedItems,
    hasMore,
    observerTarget,
    displayedCount,
    totalCount: allItems.length,
  };
}
