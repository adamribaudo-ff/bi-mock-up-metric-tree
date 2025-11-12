import { useCallback } from 'react';

/**
 * Custom hook for managing view nodes (trend and service line views)
 * @param {Object} state - Current state object
 * @param {Map} state.viewNodes - Map of metric IDs to view node info
 * @param {Function} state.setViewNodes - Setter for viewNodes
 * @param {Function} state.setManuallyMovedViewNodes - Setter for manuallyMovedViewNodes
 * @returns {Object} Actions for managing view nodes
 */
export const useViewNodeManager = ({ viewNodes, setViewNodes, setManuallyMovedViewNodes }) => {
  /**
   * Create a view node for a metric
   * @param {string} metricId - ID of the metric
   * @param {string} viewType - Type of view ('trend' or 'serviceLine')
   */
  const createViewNode = useCallback((metricId, viewType) => {
    setViewNodes((prev) => {
      const next = new Map(prev);
      const existing = next.get(metricId) || {};
      const viewNodeId = `${metricId}-${viewType}`;
      
      if (viewType === 'trend') {
        existing.trendViewId = viewNodeId;
      } else {
        existing.serviceLineViewId = viewNodeId;
      }
      next.set(metricId, existing);
      return next;
    });
  }, [setViewNodes]);

  /**
   * Remove a view node (but preserve position and size for when it's toggled back on)
   * @param {string} metricId - ID of the metric
   * @param {string} viewType - Type of view ('trend' or 'serviceLine')
   */
  const removeViewNode = useCallback((metricId, viewType) => {
    setViewNodes((prev) => {
      const next = new Map(prev);
      const existing = next.get(metricId);
      if (!existing) return prev;
      
      let viewNodeIdToRemove = null;
      if (viewType === 'trend') {
        viewNodeIdToRemove = existing.trendViewId;
        // Only delete the view node ID, preserve trendPosition and trendSize
        delete existing.trendViewId;
      } else {
        viewNodeIdToRemove = existing.serviceLineViewId;
        // Only delete the view node ID, preserve serviceLinePosition and serviceLineSize
        delete existing.serviceLineViewId;
      }
      
      // Remove from manually moved set if it was tracked
      if (viewNodeIdToRemove) {
        setManuallyMovedViewNodes((prevMoved) => {
          const nextMoved = new Set(prevMoved);
          nextMoved.delete(viewNodeIdToRemove);
          return nextMoved;
        });
      }
      
      // Always keep the entry even if only position/size remain, so state is preserved
      next.set(metricId, existing);
      return next;
    });
  }, [setViewNodes, setManuallyMovedViewNodes]);

  /**
   * Update position of a view node
   * @param {string} metricId - ID of the metric
   * @param {string} viewType - Type of view ('trend' or 'serviceLine')
   * @param {Object} position - New position {x, y}
   */
  const updateViewNodePosition = useCallback((metricId, viewType, position) => {
    setViewNodes((prev) => {
      const next = new Map(prev);
      const existing = next.get(metricId) || {};
      
      if (viewType === 'trend') {
        existing.trendPosition = position;
      } else {
        existing.serviceLinePosition = position;
      }
      
      next.set(metricId, existing);
      return next;
    });
  }, [setViewNodes]);

  /**
   * Update size of a view node
   * @param {string} metricId - ID of the metric
   * @param {string} viewType - Type of view ('trend' or 'serviceLine')
   * @param {Object} size - New size {width, height}
   */
  const updateViewNodeSize = useCallback((metricId, viewType, size) => {
    setViewNodes((prev) => {
      const next = new Map(prev);
      const existing = next.get(metricId) || {};
      
      if (viewType === 'trend') {
        existing.trendSize = size;
      } else {
        existing.serviceLineSize = size;
      }
      
      next.set(metricId, existing);
      return next;
    });
  }, [setViewNodes]);

  /**
   * Mark a view node as manually moved
   * @param {string} viewNodeId - ID of the view node
   */
  const markViewNodeAsMoved = useCallback((viewNodeId) => {
    setManuallyMovedViewNodes((prev) => {
      if (prev.has(viewNodeId)) return prev;
      return new Set(prev).add(viewNodeId);
    });
  }, [setManuallyMovedViewNodes]);

  return {
    createViewNode,
    removeViewNode,
    updateViewNodePosition,
    updateViewNodeSize,
    markViewNodeAsMoved,
  };
};
