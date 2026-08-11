"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SelectionContextValue {
  selectedIds: Set<number>;
  isSelecting: boolean;
  setIsSelecting: (val: boolean) => void;
  toggleSelect: (id: number) => void;
  selectMultiple: (ids: number[]) => void;
  deselectMultiple: (ids: number[]) => void;
  clearSelection: () => void;
  isSelected: (id: number) => boolean;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectMultiple = useCallback((ids: number[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const deselectMultiple = useCallback((ids: number[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: number) => selectedIds.has(id),
    [selectedIds]
  );

  return (
    <SelectionContext.Provider
      value={{
        selectedIds,
        isSelecting,
        setIsSelecting,
        toggleSelect,
        selectMultiple,
        deselectMultiple,
        clearSelection,
        isSelected,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return ctx;
}
