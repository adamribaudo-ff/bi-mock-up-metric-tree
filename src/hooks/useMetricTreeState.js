import { useState, useEffect, useCallback, useRef } from 'react';
import { loadState, saveState, clearPageState } from '../utils/storage';

/**
 * Custom hook for managing MetricTree state with localStorage persistence
 * @param {string} currentPage - The current page ID
 * @param {Array} metrics - Array of metric objects
 * @returns {Object} State and actions for managing metric tree
 */
export const useMetricTreeState = (currentPage, metrics) => {
  // Track which level 2 metrics are expanded
  const [expandedMetrics, setExpandedMetrics] = useState(() => {
    const saved = loadState(currentPage, 'expandedMetrics', null);
    if (saved) return new Set(saved);
    // Default: no metrics expanded (collapsed state)
    return new Set();
  });

  // Track which view nodes exist (trend and service line views)
  const [viewNodes, setViewNodes] = useState(() => {
    const saved = loadState(currentPage, 'viewNodes', null);
    if (saved) return new Map(saved);
    return new Map();
  });

  // Track which view nodes have been manually moved by the user
  const [manuallyMovedViewNodes, setManuallyMovedViewNodes] = useState(() => {
    const saved = loadState(currentPage, 'manuallyMovedViewNodes', null);
    if (saved) return new Set(saved);
    return new Set();
  });

  // Track which individual child nodes are hidden
  const [hiddenNodes, setHiddenNodes] = useState(() => {
    const saved = loadState(currentPage, 'hiddenNodes', null);
    if (saved) return new Set(saved);
    // Default: start with no hidden nodes (all root questions visible, children collapsed via expandedMetrics)
    return new Set();
  });

  // Snapshot date state - default to November 2025
  const [snapshotDate, setSnapshotDate] = useState(() => {
    return loadState(currentPage, 'snapshotDate', '2025-11');
  });

  // Reset state when page changes
  useEffect(() => {
    const savedExpanded = loadState(currentPage, 'expandedMetrics', null);
    setExpandedMetrics(
      savedExpanded 
        ? new Set(savedExpanded)
        : new Set() // Default: no metrics expanded
    );

    const savedViewNodes = loadState(currentPage, 'viewNodes', null);
    setViewNodes(savedViewNodes ? new Map(savedViewNodes) : new Map());

    const savedMoved = loadState(currentPage, 'manuallyMovedViewNodes', null);
    setManuallyMovedViewNodes(savedMoved ? new Set(savedMoved) : new Set());

    const savedHidden = loadState(currentPage, 'hiddenNodes', null);
    setHiddenNodes(savedHidden ? new Set(savedHidden) : new Set());

    const savedDate = loadState(currentPage, 'snapshotDate', '2025-11');
    setSnapshotDate(savedDate);
  }, [currentPage, metrics.length]);

  // Auto-save expandedMetrics to localStorage
  useEffect(() => {
    saveState(currentPage, 'expandedMetrics', Array.from(expandedMetrics));
  }, [expandedMetrics, currentPage]);

  // Auto-save viewNodes to localStorage
  useEffect(() => {
    saveState(currentPage, 'viewNodes', Array.from(viewNodes.entries()));
  }, [viewNodes, currentPage]);

  // Auto-save manuallyMovedViewNodes to localStorage
  useEffect(() => {
    saveState(currentPage, 'manuallyMovedViewNodes', Array.from(manuallyMovedViewNodes));
  }, [manuallyMovedViewNodes, currentPage]);

  // Auto-save hiddenNodes to localStorage
  useEffect(() => {
    saveState(currentPage, 'hiddenNodes', Array.from(hiddenNodes));
  }, [hiddenNodes, currentPage]);

  // Auto-save snapshotDate to localStorage
  useEffect(() => {
    saveState(currentPage, 'snapshotDate', snapshotDate);
  }, [snapshotDate, currentPage]);

  // Reset all state to defaults
  const resetState = useCallback(() => {
    clearPageState(currentPage);
    setExpandedMetrics(new Set()); // Default: no metrics expanded
    setViewNodes(new Map());
    setManuallyMovedViewNodes(new Set());
    setHiddenNodes(new Set()); // No hidden nodes by default
    setSnapshotDate('2025-11');
  }, [currentPage, metrics.length]);

  return {
    // State
    expandedMetrics,
    viewNodes,
    manuallyMovedViewNodes,
    hiddenNodes,
    snapshotDate,

    // Setters (for direct state updates)
    setExpandedMetrics,
    setViewNodes,
    setManuallyMovedViewNodes,
    setHiddenNodes,
    setSnapshotDate,

    // Actions
    resetState,
  };
};
