/**
 * Layout calculation utilities for MetricTree node positioning
 */

// Layout constants
export const LAYOUT_CONSTANTS = {
  NODE_WIDTH: 280,
  HORIZONTAL_SPACING: 320,
  VERTICAL_SPACING: 450,
  OVERLAP_THRESHOLD_X: 320,
  OVERLAP_THRESHOLD_Y: 50,
  LEVEL2_OVERLAP_THRESHOLD_Y: 200,
  MAX_ADJUSTMENT_ATTEMPTS: 100,
};

/**
 * Check if two positions overlap
 * @param {Object} pos1 - First position {x, y}
 * @param {Object} pos2 - Second position {x, y}
 * @param {number} thresholdX - Horizontal overlap threshold
 * @param {number} thresholdY - Vertical overlap threshold
 * @returns {boolean} True if positions overlap
 */
export const checkOverlap = (pos1, pos2, thresholdX, thresholdY) => {
  const distanceX = Math.abs(pos1.x - pos2.x);
  const distanceY = Math.abs(pos1.y - pos2.y);
  return distanceX < thresholdX && distanceY < thresholdY;
};

/**
 * Calculate positions for level 3 children of a parent node
 * @param {Object} parent - Parent metric node
 * @param {Array} children - Array of child metrics
 * @param {Object} parentPos - Parent position {x, y}
 * @returns {Array} Array of positions {id, x, y}
 */
export const calculateChildPositions = (parent, children, parentPos) => {
  const sortedChildren = children.sort((a, b) => a.id.localeCompare(b.id));
  const totalSiblings = sortedChildren.length;
  const startX = parentPos.x - ((totalSiblings - 1) * LAYOUT_CONSTANTS.HORIZONTAL_SPACING) / 2;

  return sortedChildren.map((child, index) => ({
    id: child.id,
    x: startX + (index * LAYOUT_CONSTANTS.HORIZONTAL_SPACING),
    y: parentPos.y + LAYOUT_CONSTANTS.VERTICAL_SPACING,
  }));
};

/**
 * Adjust position to avoid overlaps with existing positions
 * @param {Object} pos - Position to adjust {id, x, y}
 * @param {Array} existingPositions - Array of existing positions
 * @param {Array} level2Positions - Array of level 2 node positions for overlap checking
 * @returns {Object} Adjusted position {id, x, y}
 */
export const adjustPositionForOverlap = (pos, existingPositions, level2Positions) => {
  let adjustedX = pos.x;
  let adjustedY = pos.y;
  let hasOverlap = true;
  let attempts = 0;

  while (hasOverlap && attempts < LAYOUT_CONSTANTS.MAX_ADJUSTMENT_ATTEMPTS) {
    hasOverlap = false;

    // Check overlap with existing level 3 positions
    for (const existing of existingPositions) {
      if (checkOverlap(
        { x: adjustedX, y: adjustedY },
        existing,
        LAYOUT_CONSTANTS.OVERLAP_THRESHOLD_X,
        LAYOUT_CONSTANTS.OVERLAP_THRESHOLD_Y
      )) {
        hasOverlap = true;
        adjustedX = existing.x + LAYOUT_CONSTANTS.HORIZONTAL_SPACING;
        break;
      }
    }

    // Check overlap with level 2 nodes
    if (!hasOverlap) {
      for (const level2Pos of level2Positions) {
        if (checkOverlap(
          { x: adjustedX, y: adjustedY },
          level2Pos,
          LAYOUT_CONSTANTS.OVERLAP_THRESHOLD_X,
          LAYOUT_CONSTANTS.LEVEL2_OVERLAP_THRESHOLD_Y
        )) {
          hasOverlap = true;
          adjustedX = level2Pos.x + LAYOUT_CONSTANTS.HORIZONTAL_SPACING;
          break;
        }
      }
    }

    attempts++;
  }

  return { id: pos.id, x: adjustedX, y: adjustedY };
};

/**
 * Calculate auto-layout positions for all visible nodes
 * @param {Array} visibleMetrics - Array of visible metric objects
 * @param {Set} expandedMetrics - Set of expanded metric IDs
 * @returns {Map} Map of node ID to position {x, y}
 */
export const calculateNodePositions = (visibleMetrics, expandedMetrics) => {
  const nodePositions = new Map();

  // Set base positions for level 1 and 2
  visibleMetrics.forEach((metric) => {
    if (metric.level === 1 || metric.level === 2) {
      nodePositions.set(metric.id, metric.position);
    }
  });

  // Group level 3 nodes by their parent
  const childrenByParent = new Map();
  visibleMetrics.forEach((metric) => {
    if (metric.level === 3 && metric.parentId) {
      if (!childrenByParent.has(metric.parentId)) {
        childrenByParent.set(metric.parentId, []);
      }
      childrenByParent.get(metric.parentId).push(metric);
    }
  });

  // Calculate positions for each parent's children
  const allLevel3Positions = [];
  childrenByParent.forEach((children, parentId) => {
    const parent = visibleMetrics.find(m => m.id === parentId);
    if (!parent) return;

    const parentPos = nodePositions.get(parent.id);
    const childPositions = calculateChildPositions(parent, children, parentPos);
    allLevel3Positions.push(...childPositions);
  });

  // Get level 2 positions for overlap checking
  const level2Positions = [];
  visibleMetrics.forEach((metric) => {
    if (metric.level === 2) {
      level2Positions.push(nodePositions.get(metric.id));
    }
  });

  // Adjust positions to avoid overlaps
  const adjustedPositions = [];
  allLevel3Positions.forEach((pos) => {
    const adjusted = adjustPositionForOverlap(pos, adjustedPositions, level2Positions);
    adjustedPositions.push(adjusted);
    nodePositions.set(adjusted.id, { x: adjusted.x, y: adjusted.y });
  });

  return nodePositions;
};

/**
 * Calculate default view node position relative to metric node
 * @param {Object} metricPosition - Metric node position {x, y}
 * @param {string} viewType - Type of view ('trend' or 'serviceLine')
 * @param {Object} options - Options for positioning
 * @param {number} options.metricCardHeight - Height of metric card
 * @param {number} options.viewCardHeight - Height of view card
 * @param {number} options.horizontalOffset - Horizontal offset from metric
 * @param {Object} options.trendNodePosition - Position of trend node (for serviceLine stacking)
 * @param {number} options.trendNodeHeight - Height of trend node (for serviceLine stacking)
 * @returns {Object} Position {x, y}
 */
export const calculateViewNodePosition = (
  metricPosition,
  viewType,
  {
    metricCardHeight = 280,
    viewCardHeight = 350,
    horizontalOffset = 320,
    trendNodePosition = null,
    trendNodeHeight = null,
  } = {}
) => {
  // Calculate vertical alignment: center the view with the metric card
  const verticalOffset = (metricCardHeight - viewCardHeight) / 2;
  
  // For service line views, position below trend view if it exists
  if (viewType === 'serviceLine' && trendNodePosition) {
    const trendHeight = trendNodeHeight || 350;
    return {
      x: metricPosition.x + horizontalOffset,
      y: trendNodePosition.y + trendHeight + 20, // 20px gap
    };
  }
  
  // Default: center with metric card
  return {
    x: metricPosition.x + horizontalOffset,
    y: metricPosition.y + verticalOffset,
  };
};
