# React Flow State Management

## How React Flow Represents Canvas State

React Flow represents the entire canvas state through:

### 1. **Nodes Array**
Each node contains:
- `id`: Unique identifier
- `type`: Node type (e.g., 'metric', 'trendView', 'serviceLineView')
- `position`: `{ x, y }` coordinates
- `data`: Custom data object (contains your metric data, callbacks, etc.)
- `selected`: Boolean for selection state
- `draggable`: Boolean for drag capability
- Other optional properties (style, className, etc.)

### 2. **Edges Array**
Each edge contains:
- `id`: Unique identifier
- `source`: Source node ID
- `target`: Target node ID
- `sourceHandle`: Optional handle ID on source
- `targetHandle`: Optional handle ID on target
- `type`: Edge type (e.g., 'smoothstep', 'default')
- `style`: Styling properties
- `animated`: Boolean for animation
- `markerEnd`: Arrow marker configuration

### 3. **Viewport State** (Zoom & Pan)
- `x`: Horizontal pan offset
- `y`: Vertical pan offset
- `zoom`: Zoom level (1.0 = 100%)

## Storing State

### Method 1: Using React Flow's Built-in Methods

React Flow provides `toObject()` and `fromObject()` methods:

```javascript
// Save state
const flowState = reactFlowInstance.toObject();
// Returns: { nodes: [...], edges: [...], viewport: { x, y, zoom } }

// Store it
localStorage.setItem('flowState', JSON.stringify(flowState));

// Restore state
const savedState = JSON.parse(localStorage.getItem('flowState'));
const { nodes, edges, viewport } = reactFlowInstance.fromObject(savedState);
setNodes(nodes);
setEdges(edges);
setViewport(viewport);
```

### Method 2: Manual Serialization (More Control)

For your MetricTree, you'll also want to save custom state:
- `expandedMetrics`: Which metrics are expanded
- `viewNodes`: Which trend/service line views are open
- `manuallyMovedViewNodes`: Which view nodes have been manually positioned
- `snapshotDate`: Selected snapshot date

```javascript
const saveState = () => {
  const state = {
    // React Flow state
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        // Only save serializable data, not functions
        metric: node.data.metric,
        isExpanded: node.data.isExpanded,
        // Don't save callbacks
      },
      selected: node.selected,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      style: edge.style,
      animated: edge.animated,
      markerEnd: edge.markerEnd,
    })),
    viewport: reactFlowInstance.current?.getViewport() || { x: 0, y: 0, zoom: 1 },
    
    // Custom state
    expandedMetrics: Array.from(expandedMetrics),
    viewNodes: Array.from(viewNodes.entries()).map(([key, value]) => [key, value]),
    manuallyMovedViewNodes: Array.from(manuallyMovedViewNodes),
    snapshotDate: snapshotDate,
  };
  
  localStorage.setItem('metricTreeState', JSON.stringify(state));
};

const restoreState = () => {
  const saved = localStorage.getItem('metricTreeState');
  if (!saved) return;
  
  const state = JSON.parse(saved);
  
  // Restore React Flow state
  setNodes(state.nodes);
  setEdges(state.edges);
  reactFlowInstance.current?.setViewport(state.viewport);
  
  // Restore custom state
  setExpandedMetrics(new Set(state.expandedMetrics));
  setViewNodes(new Map(state.viewNodes));
  setManuallyMovedViewNodes(new Set(state.manuallyMovedViewNodes));
  setSnapshotDate(state.snapshotDate);
};
```

## Important Considerations

1. **Don't serialize functions**: The `data` object in nodes contains callbacks. You'll need to reconstruct these when restoring.

2. **Metric data**: Your nodes reference full metric objects from `metrics.js`. You may want to only store metric IDs and look them up on restore.

3. **Viewport state**: Use `reactFlowInstance.getViewport()` to get current viewport, and `setViewport()` to restore it.

4. **Timing**: Restore state after React Flow is initialized (in `onInit` or `useEffect`).

## Example Implementation

See the updated `MetricTree.jsx` for a complete implementation with save/restore buttons.

