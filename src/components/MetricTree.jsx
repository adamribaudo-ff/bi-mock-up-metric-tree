import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MetricNode from './MetricNode';
import TrendViewNode from './TrendViewNode';
import ServiceLineViewNode from './ServiceLineViewNode';
import { getMetricsForPage } from '../data/pageMetrics';
import { getChildren } from '../data/metrics';
import { usePage } from '../context/PageContext';
import './MetricTree.css';

const nodeTypes = {
  metric: MetricNode,
  trendView: TrendViewNode,
  serviceLineView: ServiceLineViewNode,
};

const MetricTree = () => {
  const { currentPage } = usePage();
  const metrics = getMetricsForPage(currentPage);
  
  // Get storage key for current page (memoized)
  const getStorageKey = useCallback((key) => `metricTreeState-${currentPage}-${key}`, [currentPage]);
  
  // Helper to get storage key (for use in initial state)
  const getStorageKeySync = (key) => `metricTreeState-${currentPage}-${key}`;
  
  // Track which level 2 metrics are expanded
  // Default to having Sales Pipeline expanded (only for revenue-plan)
  const [expandedMetrics, setExpandedMetrics] = useState(() => {
    const saved = localStorage.getItem(getStorageKeySync('expandedMetrics'));
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set(metrics.length > 0 ? ['sales-pipeline'] : []);
      }
    }
    return new Set(metrics.length > 0 ? ['sales-pipeline'] : []);
  });
  
  // Track which view nodes exist (trend and service line views)
  const [viewNodes, setViewNodes] = useState(() => {
    const saved = localStorage.getItem(getStorageKeySync('viewNodes'));
    if (saved) {
      try {
        return new Map(JSON.parse(saved));
      } catch (e) {
        return new Map();
      }
    }
    return new Map();
  });
  
  // Track which view nodes have been manually moved by the user
  const [manuallyMovedViewNodes, setManuallyMovedViewNodes] = useState(() => {
    const saved = localStorage.getItem(getStorageKeySync('manuallyMovedViewNodes'));
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });
  
  // Snapshot date state - default to November 2025
  const [snapshotDate, setSnapshotDate] = useState(() => {
    const saved = localStorage.getItem(getStorageKeySync('snapshotDate'));
    return saved || '2025-11';
  });
  
  // Reset state when page changes
  useEffect(() => {
    const storageKey = (key) => `metricTreeState-${currentPage}-${key}`;
    
    // Load state for new page
    const savedExpanded = localStorage.getItem(storageKey('expandedMetrics'));
    if (savedExpanded) {
      try {
        const parsed = JSON.parse(savedExpanded);
        setExpandedMetrics(new Set(parsed));
      } catch (e) {
        setExpandedMetrics(new Set(metrics.length > 0 ? ['sales-pipeline'] : []));
      }
    } else {
      setExpandedMetrics(new Set(metrics.length > 0 ? ['sales-pipeline'] : []));
    }
    
    const savedViewNodes = localStorage.getItem(storageKey('viewNodes'));
    if (savedViewNodes) {
      try {
        const parsed = JSON.parse(savedViewNodes);
        setViewNodes(new Map(parsed));
      } catch (e) {
        setViewNodes(new Map());
      }
    } else {
      setViewNodes(new Map());
    }
    
    const savedMoved = localStorage.getItem(storageKey('manuallyMovedViewNodes'));
    if (savedMoved) {
      try {
        const parsed = JSON.parse(savedMoved);
        setManuallyMovedViewNodes(new Set(parsed));
      } catch (e) {
        setManuallyMovedViewNodes(new Set());
      }
    } else {
      setManuallyMovedViewNodes(new Set());
    }
    
    const savedDate = localStorage.getItem(storageKey('snapshotDate'));
    setSnapshotDate(savedDate || '2025-11');
    
    hasRestoredPositions.current = false;
  }, [currentPage]);
  
  // Generate month/year options going back 24 months
  const snapshotDateOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date(2025, 10, 1); // November 2025 (month is 0-indexed)
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Convert back to 1-indexed
      const monthName = date.toLocaleString('default', { month: 'long' });
      const value = `${year}-${String(month).padStart(2, '0')}`;
      options.push({
        value,
        label: `${monthName} ${year}`
      });
    }
    
    return options;
  }, []);

  // Toggle expansion for a metric
  const toggleExpansion = useCallback((metricId) => {
    setExpandedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }
      return next;
    });
  }, []);

  // Filter visible metrics: level 1, level 2, and level 3 if parent is expanded
  const visibleMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    return metrics.filter((metric) => {
      if (metric.level === 1 || metric.level === 2) {
        return true;
      }
      // Level 3: only show if parent is expanded
      if (metric.level === 3 && metric.parentId) {
        return expandedMetrics.has(metric.parentId);
      }
      return false;
    });
  }, [metrics, expandedMetrics]);

  // Calculate auto-layout positions for nodes
  const calculateNodePositions = useCallback((visibleMetrics, expandedMetrics) => {
    const nodePositions = new Map();
    const NODE_WIDTH = 280;
    const HORIZONTAL_SPACING = 320;
    const VERTICAL_SPACING = 450;

    // Set base positions for level 1 and 2
    visibleMetrics.forEach((metric) => {
      if (metric.level === 1) {
        nodePositions.set(metric.id, metric.position);
      } else if (metric.level === 2) {
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
      const sortedChildren = children.sort((a, b) => a.id.localeCompare(b.id));
      const totalSiblings = sortedChildren.length;
      const startX = parentPos.x - ((totalSiblings - 1) * HORIZONTAL_SPACING) / 2;

      sortedChildren.forEach((child, index) => {
        const x = startX + (index * HORIZONTAL_SPACING);
        const y = parentPos.y + VERTICAL_SPACING;
        allLevel3Positions.push({ id: child.id, x, y });
      });
    });

    // Check for overlaps and adjust positions
    const adjustedPositions = [];
    allLevel3Positions.forEach((pos) => {
      let adjustedX = pos.x;
      let adjustedY = pos.y;
      let hasOverlap = true;
      let attempts = 0;
      const maxAttempts = 100;

      while (hasOverlap && attempts < maxAttempts) {
        hasOverlap = false;
        
        // Check overlap with existing level 3 positions
        for (const existing of adjustedPositions) {
          const distanceX = Math.abs(adjustedX - existing.x);
          const distanceY = Math.abs(adjustedY - existing.y);
          
          // If nodes are too close horizontally and on the same row
          if (distanceX < HORIZONTAL_SPACING && distanceY < 50) {
            hasOverlap = true;
            // Shift to the right
            adjustedX = existing.x + HORIZONTAL_SPACING;
            break;
          }
        }

        // Check overlap with level 2 nodes
        visibleMetrics.forEach((metric) => {
          if (metric.level === 2) {
            const level2Pos = nodePositions.get(metric.id);
            const distanceX = Math.abs(adjustedX - level2Pos.x);
            const distanceY = Math.abs(adjustedY - level2Pos.y);
            
            if (distanceX < HORIZONTAL_SPACING && distanceY < 200) {
              hasOverlap = true;
              adjustedX = level2Pos.x + HORIZONTAL_SPACING;
            }
          }
        });

        attempts++;
      }

      adjustedPositions.push({ id: pos.id, x: adjustedX, y: adjustedY });
      nodePositions.set(pos.id, { x: adjustedX, y: adjustedY });
    });

    return nodePositions;
  }, []);

  // Create view nodes (trend and service line)
  const createViewNodes = useCallback((metricId, viewType) => {
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
  }, []);

  // Remove view node
  const removeViewNode = useCallback((metricId, viewType) => {
    setViewNodes((prev) => {
      const next = new Map(prev);
      const existing = next.get(metricId);
      if (!existing) return prev;
      
      let viewNodeIdToRemove = null;
      if (viewType === 'trend') {
        viewNodeIdToRemove = existing.trendViewId;
        delete existing.trendViewId;
      } else {
        viewNodeIdToRemove = existing.serviceLineViewId;
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
      
      if (Object.keys(existing).length === 0) {
        next.delete(metricId);
      } else {
        next.set(metricId, existing);
      }
      return next;
    });
  }, []);

  // Convert visible metrics to React Flow nodes with auto-layout
  const initialNodes = useMemo(() => {
    const nodePositions = calculateNodePositions(visibleMetrics, expandedMetrics);
    
    return visibleMetrics.map((metric) => {
      const position = nodePositions.get(metric.id) || metric.position;
      const viewNodeInfo = viewNodes.get(metric.id) || {};
      
      return {
        id: metric.id,
        type: 'metric',
        position,
        data: { 
          metric,
          isExpanded: expandedMetrics.has(metric.id),
          onToggleExpand: metric.level === 2 ? () => toggleExpansion(metric.id) : null,
          onCreateTrendView: () => {
            if (viewNodeInfo.trendViewId) {
              removeViewNode(metric.id, 'trend');
            } else {
              createViewNodes(metric.id, 'trend');
            }
          },
          onCreateServiceLineView: () => {
            if (viewNodeInfo.serviceLineViewId) {
              removeViewNode(metric.id, 'serviceLine');
            } else {
              createViewNodes(metric.id, 'serviceLine');
            }
          },
          hasTrendView: !!viewNodeInfo.trendViewId,
          hasServiceLineView: !!viewNodeInfo.serviceLineViewId,
        },
        draggable: true,
      };
    });
  }, [visibleMetrics, expandedMetrics, toggleExpansion, calculateNodePositions, viewNodes, createViewNodes, removeViewNode]);

  // Create edges - reversed direction (child -> parent)
  const initialEdges = useMemo(() => {
    const edges = [];
    visibleMetrics.forEach((metric) => {
      if (metric.parentId) {
        // Check if parent is also visible
        const parentVisible = visibleMetrics.some(m => m.id === metric.parentId);
        if (parentVisible) {
          edges.push({
            id: `e${metric.id}-${metric.parentId}`,
            source: metric.id, // Child is source
            target: metric.parentId, // Parent is target
            type: 'smoothstep',
            animated: true,
            style: { 
              stroke: '#2447A0', 
              strokeWidth: 2, 
              strokeDasharray: '8,4',
            },
            markerEnd: {
              type: 'arrowclosed',
              color: '#2447A0',
            },
          });
        }
      }
    });
    return edges;
  }, [visibleMetrics]);

  // Include view nodes in the nodes array
  const allNodes = useMemo(() => {
    const metricNodes = initialNodes;
    const viewNodeList = [];
    
    viewNodes.forEach((viewInfo, metricId) => {
      const metricNode = metricNodes.find(n => n.id === metricId);
      if (!metricNode) return;

      if (viewInfo.trendViewId) {
        const metric = metrics.find(m => m.id === metricId);
        if (metric) {
          viewNodeList.push({
            id: viewInfo.trendViewId,
            type: 'trendView',
            position: {
              x: metricNode.position.x + 350,
              y: metricNode.position.y,
            },
            data: { 
              metric,
              onClose: () => removeViewNode(metricId, 'trend')
            },
            draggable: true,
          });
        }
      }

      if (viewInfo.serviceLineViewId) {
        const metric = metrics.find(m => m.id === metricId);
        if (metric) {
          const yOffset = viewInfo.trendViewId ? 180 : 0;
          viewNodeList.push({
            id: viewInfo.serviceLineViewId,
            type: 'serviceLineView',
            position: {
              x: metricNode.position.x + 350,
              y: metricNode.position.y + yOffset,
            },
            data: { 
              metric,
              onClose: () => removeViewNode(metricId, 'serviceLine')
            },
            draggable: true,
          });
        }
      }
    });

    return [...metricNodes, ...viewNodeList];
  }, [initialNodes, viewNodes, metrics, removeViewNode]);

  // Include view node edges
  const allEdges = useMemo(() => {
    const metricEdges = initialEdges;
    const viewEdges = [];

    viewNodes.forEach((viewInfo, metricId) => {
      if (viewInfo.trendViewId) {
        viewEdges.push({
          id: `e${metricId}-${viewInfo.trendViewId}`,
          source: metricId,
          sourceHandle: 'view-source',
          target: viewInfo.trendViewId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#FFA823',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#FFA823',
          },
        });
      }

      if (viewInfo.serviceLineViewId) {
        viewEdges.push({
          id: `e${metricId}-${viewInfo.serviceLineViewId}`,
          source: metricId,
          sourceHandle: 'view-source',
          target: viewInfo.serviceLineViewId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#FFA823',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#FFA823',
          },
        });
      }
    });

    return [...metricEdges, ...viewEdges];
  }, [initialEdges, viewNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(allEdges);
  const reactFlowInstance = React.useRef(null);
  const hasRestoredPositions = React.useRef(false);

  // Auto-save state to localStorage
  const autoSaveState = useCallback(() => {
    if (!reactFlowInstance.current) return;

    // Use a function to get current state to avoid stale closures
    setNodes((currentNodes) => {
      setEdges((currentEdges) => {
        const viewport = reactFlowInstance.current?.getViewport() || { x: 0, y: 0, zoom: 1 };
        
        const state = {
          nodes: currentNodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
              metricId: node.data.metric?.id,
              isExpanded: node.data.isExpanded,
            },
            selected: node.selected,
          })),
          edges: currentEdges.map(edge => ({
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
          viewport: viewport,
          expandedMetrics: Array.from(expandedMetrics),
          viewNodes: Array.from(viewNodes.entries()).map(([key, value]) => [key, value]),
          manuallyMovedViewNodes: Array.from(manuallyMovedViewNodes),
          snapshotDate: snapshotDate,
        };
        
        localStorage.setItem(getStorageKey('fullState'), JSON.stringify(state));
        
        // Also save individual state pieces for easier loading
        localStorage.setItem(getStorageKey('expandedMetrics'), JSON.stringify(Array.from(expandedMetrics)));
        localStorage.setItem(getStorageKey('viewNodes'), JSON.stringify(Array.from(viewNodes.entries())));
        localStorage.setItem(getStorageKey('manuallyMovedViewNodes'), JSON.stringify(Array.from(manuallyMovedViewNodes)));
        localStorage.setItem(getStorageKey('snapshotDate'), snapshotDate);
        return currentEdges;
      });
      return currentNodes;
    });
  }, [expandedMetrics, viewNodes, manuallyMovedViewNodes, snapshotDate, setNodes, setEdges]);

  // Handle node drag - mark view nodes as manually moved during drag
  const handleNodeDrag = useCallback((event, node) => {
    if (node.type === 'trendView' || node.type === 'serviceLineView') {
      setManuallyMovedViewNodes((prev) => {
        if (prev.has(node.id)) return prev; // Already marked
        return new Set(prev).add(node.id);
      });
    }
  }, []);

  // Handle node drag stop - auto-save state
  const handleNodeDragStop = useCallback(() => {
    // Auto-save after a short delay to ensure state is updated
    setTimeout(() => {
      autoSaveState();
    }, 100);
  }, [autoSaveState]);

  // Update view node positions relative to their metric cards only if they haven't been manually moved
  useEffect(() => {
    if (viewNodes.size === 0) return;
    
    setNodes((currentNodes) => {
      const updatedNodes = [...currentNodes];
      let hasChanges = false;
      const nodesToMarkAsMoved = [];

      viewNodes.forEach((viewInfo, metricId) => {
        const metricNode = updatedNodes.find(n => n.id === metricId);
        if (!metricNode) return;

        if (viewInfo.trendViewId) {
          const trendNode = updatedNodes.find(n => n.id === viewInfo.trendViewId);
          if (trendNode && !manuallyMovedViewNodes.has(trendNode.id)) {
            const expectedX = metricNode.position.x + 350;
            const expectedY = metricNode.position.y;
            // Check if node is significantly away from expected position (was manually moved)
            const distance = Math.sqrt(
              Math.pow(trendNode.position.x - expectedX, 2) + 
              Math.pow(trendNode.position.y - expectedY, 2)
            );
            // If it's far from expected position, mark as manually moved (but do it outside this callback)
            if (distance > 50) {
              nodesToMarkAsMoved.push(trendNode.id);
            } else if (trendNode.position.x !== expectedX || trendNode.position.y !== expectedY) {
              trendNode.position = { x: expectedX, y: expectedY };
              hasChanges = true;
            }
          }
        }

        if (viewInfo.serviceLineViewId) {
          const serviceLineNode = updatedNodes.find(n => n.id === viewInfo.serviceLineViewId);
          if (serviceLineNode && !manuallyMovedViewNodes.has(serviceLineNode.id)) {
            const yOffset = viewInfo.trendViewId ? 180 : 0;
            const expectedX = metricNode.position.x + 350;
            const expectedY = metricNode.position.y + yOffset;
            // Check if node is significantly away from expected position (was manually moved)
            const distance = Math.sqrt(
              Math.pow(serviceLineNode.position.x - expectedX, 2) + 
              Math.pow(serviceLineNode.position.y - expectedY, 2)
            );
            // If it's far from expected position, mark as manually moved (but do it outside this callback)
            if (distance > 50) {
              nodesToMarkAsMoved.push(serviceLineNode.id);
            } else if (serviceLineNode.position.x !== expectedX || serviceLineNode.position.y !== expectedY) {
              serviceLineNode.position = { x: expectedX, y: expectedY };
              hasChanges = true;
            }
          }
        }
      });

      // Mark nodes as manually moved outside of setNodes to avoid infinite loops
      if (nodesToMarkAsMoved.length > 0) {
        setTimeout(() => {
          setManuallyMovedViewNodes((prev) => {
            const next = new Set(prev);
            nodesToMarkAsMoved.forEach(id => next.add(id));
            return next;
          });
        }, 0);
      }

      return hasChanges ? updatedNodes : currentNodes;
    });
  }, [viewNodes, manuallyMovedViewNodes, setNodes]);

  // Track node structure changes using refs to avoid infinite loops
  const lastNodeStructureRef = useRef('');
  
  // Update nodes and edges when structure changes, preserving existing positions
  useEffect(() => {
    // Calculate structure key based on visible metrics and view nodes
    const metricIds = visibleMetrics.map(m => m.id).sort().join(',');
    const viewNodeIds = Array.from(viewNodes.values())
      .flatMap(v => [v.trendViewId, v.serviceLineViewId].filter(Boolean))
      .sort()
      .join(',');
    const nodeStructureKey = `${metricIds}|${viewNodeIds}`;
    
    // Only update if the node structure (IDs/types) has actually changed
    if (lastNodeStructureRef.current === nodeStructureKey) {
      return;
    }
    lastNodeStructureRef.current = nodeStructureKey;
    
    setNodes((currentNodes) => {
      // Create a map of existing node positions
      const positionMap = new Map();
      currentNodes.forEach(node => {
        positionMap.set(node.id, node.position);
      });

      // Merge new nodes with existing positions
      return allNodes.map(newNode => {
        // For view nodes, position them relative to their metric card only if not manually moved
        if (newNode.type === 'trendView' || newNode.type === 'serviceLineView') {
          // Find the metric node this view belongs to
          const metricId = newNode.id.split('-').slice(0, -1).join('-');
          const metricNode = currentNodes.find(n => n.id === metricId) || allNodes.find(n => n.id === metricId);
          if (metricNode) {
            const existingViewNode = currentNodes.find(n => n.id === newNode.id);
            // If view node was manually moved, preserve its position
            if (existingViewNode && manuallyMovedViewNodes.has(newNode.id)) {
              return { ...newNode, position: existingViewNode.position };
            }
            // If view node already exists, preserve its position (will be updated by the other useEffect if needed)
            if (existingViewNode && existingViewNode.position) {
              return { ...newNode, position: existingViewNode.position };
            }
            // New view node, position relative to metric
            const yOffset = (newNode.type === 'serviceLineView' && viewNodes.get(metricId)?.trendViewId) ? 180 : 0;
            return { 
              ...newNode, 
              position: { 
                x: metricNode.position.x + 350, 
                y: metricNode.position.y + yOffset 
              } 
            };
          }
        }
        
        // For metric nodes, preserve existing position if it exists
        const existingPosition = positionMap.get(newNode.id);
        if (existingPosition) {
          return { ...newNode, position: existingPosition };
        }
        return newNode;
      });
    });
  }, [visibleMetrics, viewNodes, setNodes, manuallyMovedViewNodes]);

  // Track edge structure changes using refs to avoid infinite loops
  const lastEdgeStructureRef = useRef('');
  
  useEffect(() => {
    // Calculate structure key based on visible metrics and view nodes (which determine edges)
    const metricEdgeIds = visibleMetrics
      .filter(m => m.parentId)
      .map(m => `e${m.id}-${m.parentId}`)
      .sort()
      .join(',');
    const viewEdgeIds = Array.from(viewNodes.values())
      .flatMap(v => [
        v.trendViewId ? `e${v.trendViewId?.split('-').slice(0, -1).join('-')}-${v.trendViewId}` : null,
        v.serviceLineViewId ? `e${v.serviceLineViewId?.split('-').slice(0, -1).join('-')}-${v.serviceLineViewId}` : null
      ].filter(Boolean))
      .sort()
      .join(',');
    const edgeStructureKey = `${metricEdgeIds}|${viewEdgeIds}`;
    
    // Only update if the edge structure has actually changed
    if (lastEdgeStructureRef.current === edgeStructureKey) {
      return;
    }
    lastEdgeStructureRef.current = edgeStructureKey;
    
    setEdges(allEdges);
  }, [visibleMetrics, viewNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Auto-save when expanded metrics change
  useEffect(() => {
    if (reactFlowInstance.current) {
      localStorage.setItem(getStorageKey('expandedMetrics'), JSON.stringify(Array.from(expandedMetrics)));
      const timeoutId = setTimeout(() => {
        autoSaveState();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [expandedMetrics, autoSaveState, getStorageKey]);
  
  // Auto-save when view nodes change
  useEffect(() => {
    if (reactFlowInstance.current) {
      localStorage.setItem(getStorageKey('viewNodes'), JSON.stringify(Array.from(viewNodes.entries())));
      const timeoutId = setTimeout(() => {
        autoSaveState();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [viewNodes, autoSaveState, getStorageKey]);
  
  // Auto-save when snapshot date changes
  useEffect(() => {
    if (reactFlowInstance.current) {
      localStorage.setItem(getStorageKey('snapshotDate'), snapshotDate);
      const timeoutId = setTimeout(() => {
        autoSaveState();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [snapshotDate, autoSaveState, getStorageKey]);

  // Reset view - clear saved state and reset to defaults
  const resetView = useCallback(() => {
    // Clear localStorage for current page
    localStorage.removeItem(getStorageKey('fullState'));
    localStorage.removeItem(getStorageKey('expandedMetrics'));
    localStorage.removeItem(getStorageKey('viewNodes'));
    localStorage.removeItem(getStorageKey('manuallyMovedViewNodes'));
    localStorage.removeItem(getStorageKey('snapshotDate'));
    
    // Reset state to defaults - this will trigger recalculation of initialNodes
    setExpandedMetrics(new Set(metrics.length > 0 ? ['sales-pipeline'] : []));
    setViewNodes(new Map());
    setManuallyMovedViewNodes(new Set());
    setSnapshotDate('2025-11');
    hasRestoredPositions.current = false;
    
    // Reset viewport - use a lower zoom to show more of the canvas
    if (reactFlowInstance.current) {
      reactFlowInstance.current.setViewport({ x: 0, y: 0, zoom: 0.5 });
    }
    
    // Force nodes to recalculate positions from initial metric positions
    // Wait for state updates to propagate, then recalculate
    setTimeout(() => {
      setNodes((currentNodes) => {
        // Filter to only metric nodes for recalculation
        const metricNodes = currentNodes.filter(n => n.type === 'metric');
        if (metricNodes.length === 0) return currentNodes;
        
        // Get current visible metrics (after state update)
        const currentVisibleMetrics = metrics.filter((metric) => {
          if (metric.level === 1 || metric.level === 2) {
            return true;
          }
          if (metric.level === 3 && metric.parentId) {
            return metrics.length > 0 && ['sales-pipeline'].includes(metric.parentId);
          }
          return false;
        });
        
        // Recalculate positions using calculateNodePositions
        const defaultExpanded = new Set(metrics.length > 0 ? ['sales-pipeline'] : []);
        const nodePositions = calculateNodePositions(currentVisibleMetrics, defaultExpanded);
        
        return currentNodes.map(node => {
          // Only reset metric nodes, not view nodes
          if (node.type === 'metric') {
            const metric = metrics.find(m => m.id === node.id);
            if (metric) {
              // Use calculated position or fall back to metric's initial position
              const calculatedPos = nodePositions.get(node.id);
              const initialPos = calculatedPos || metric.position;
              return { ...node, position: initialPos };
            }
          }
          return node;
        });
      });
    }, 200);
  }, [getStorageKey, metrics, calculateNodePositions, setNodes]);

  // Restore viewport on initial load
  useEffect(() => {
    const storageKey = `metricTreeState-${currentPage}-fullState`;
    const saved = localStorage.getItem(storageKey);
    if (!saved || !reactFlowInstance.current) return;
    
    try {
      const state = JSON.parse(saved);
      
      // Restore viewport after React Flow is initialized
      if (state.viewport) {
        setTimeout(() => {
          reactFlowInstance.current?.setViewport(state.viewport);
        }, 200);
      }
    } catch (error) {
      console.error('Error restoring viewport on load:', error);
    }
  }, [currentPage]); // Run when page changes

  // Restore node positions from saved state after nodes are created
  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey('fullState'));
    if (!saved || nodes.length === 0 || hasRestoredPositions.current) return;
    
    try {
      const state = JSON.parse(saved);
      if (!state.nodes || state.nodes.length === 0) return;
      
      // Create a map of saved positions
      const savedPositions = new Map();
      state.nodes.forEach(node => {
        savedPositions.set(node.id, node.position);
      });
      
      // Check if any positions need to be restored
      const needsRestore = nodes.some(node => {
        const savedPosition = savedPositions.get(node.id);
        return savedPosition && (
          Math.abs(node.position.x - savedPosition.x) > 1 || 
          Math.abs(node.position.y - savedPosition.y) > 1
        );
      });
      
      if (needsRestore) {
        // Update node positions if they exist in saved state
        setNodes((currentNodes) => {
          return currentNodes.map(node => {
            const savedPosition = savedPositions.get(node.id);
            if (savedPosition) {
              return { ...node, position: savedPosition };
            }
            return node;
          });
        });
        hasRestoredPositions.current = true;
      }
    } catch (error) {
      console.error('Error restoring node positions:', error);
    }
  }, [nodes.length, setNodes, currentPage]); // Run when node count or page changes

  // Show empty state if no metrics
  if (!metrics || metrics.length === 0) {
    return (
      <div className="metric-tree-container">
        <div className="empty-state">
          <h2>No metrics available</h2>
          <p>Metrics for this page will be displayed here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metric-tree-container">
      <div className="snapshot-date-control">
        <button className="reset-view-btn" onClick={resetView} title="Reset view to defaults">
          🔄 Reset View
        </button>
        <label htmlFor="snapshot-date-select" className="snapshot-date-label">
          Snapshot Date:
        </label>
        <select
          id="snapshot-date-select"
          className="snapshot-date-select"
          value={snapshotDate}
          onChange={(e) => setSnapshotDate(e.target.value)}
        >
          {snapshotDateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        fitView={false}
        attributionPosition="bottom-left"
        panOnScroll={false}
        zoomOnScroll={true}
        panOnDrag={true}
      >
        <Background 
          variant="lines" 
          gap={20} 
          size={1}
          color="#d1d5db"
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.metric?.level === 1) return '#2447A0';
            if (node.data?.metric?.level === 2) return '#2447A0';
            return '#CCD7F3';
          }}
          maskColor="rgba(36, 71, 160, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

export default MetricTree;

