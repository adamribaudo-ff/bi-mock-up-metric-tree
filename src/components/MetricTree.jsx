import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeToolbar,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import MetricNode from './MetricNode';
import TrendViewNode from './TrendViewNode';
import ServiceLineViewNode from './ServiceLineViewNode';
import MetricEdge from './MetricEdge';
import { getMetricsForPage } from '../data/pageMetrics';
import { getChildren } from '../data/metrics';
import { usePage } from '../context/PageContext';
import { useMetricTreeState } from '../hooks/useMetricTreeState';
import { useViewNodeManager } from '../hooks/useViewNodeManager';
import { calculateNodePositions } from '../utils/layoutCalculations';
import { saveFullState, loadFullState } from '../utils/storage';
import './MetricTree.css';

const nodeTypes = {
  metric: MetricNode,
  trendView: TrendViewNode,
  serviceLineView: ServiceLineViewNode,
};

const edgeTypes = {
  metricEdge: MetricEdge,
};

const MetricTree = () => {
  const { currentPage } = usePage();
  const metrics = getMetricsForPage(currentPage);
  
  // Use custom hooks for state management
  const {
    expandedMetrics,
    viewNodes,
    manuallyMovedViewNodes,
    hiddenNodes,
    snapshotDate,
    setExpandedMetrics,
    setViewNodes,
    setManuallyMovedViewNodes,
    setHiddenNodes,
    setSnapshotDate,
    resetState,
  } = useMetricTreeState(currentPage, metrics);

  // Use view node manager for view node operations
  const {
    createViewNode,
    removeViewNode,
    updateViewNodePosition,
    updateViewNodeSize,
    markViewNodeAsMoved,
  } = useViewNodeManager({
    viewNodes,
    setViewNodes,
    setManuallyMovedViewNodes,
  });
  
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
    const allChildren = getChildren(metricId);
    
    setHiddenNodes((prevHidden) => {
      const hiddenChildren = allChildren.filter(child => prevHidden.has(child.id));
      const hasHiddenChildren = hiddenChildren.length > 0;
      
      // If there are hidden children, unhide them all
      if (hasHiddenChildren) {
        const nextHidden = new Set(prevHidden);
        allChildren.forEach(child => {
          nextHidden.delete(child.id);
        });
        return nextHidden;
      }
      return prevHidden;
    });
    
    setExpandedMetrics((prev) => {
      const hiddenChildren = allChildren.filter(child => hiddenNodes.has(child.id));
      const hasHiddenChildren = hiddenChildren.length > 0;
      
      if (hasHiddenChildren || !prev.has(metricId)) {
        // Expand if there are hidden children or parent is collapsed
        const next = new Set(prev);
        next.add(metricId);
        return next;
      } else {
        // All children visible and parent expanded, so collapse
        const next = new Set(prev);
        next.delete(metricId);
        return next;
      }
    });
  }, [hiddenNodes]);

  // Remove a child node and all its descendants by adding them to the hidden set
  const removeChildNode = useCallback((childId, parentId) => {
    // Recursively collect the child and all its descendants
    const nodesToHide = [childId];
    const collectDescendants = (nodeId) => {
      const children = getChildren(nodeId);
      children.forEach(child => {
        nodesToHide.push(child.id);
        collectDescendants(child.id); // Recursively collect grandchildren
      });
    };
    collectDescendants(childId);
    
    // Add the child and all descendants to the hidden nodes set
    setHiddenNodes((prev) => {
      const next = new Set(prev);
      nodesToHide.forEach(id => next.add(id));
      return next;
    });
  }, []);

  // Filter visible metrics: level 1, level 2, and level 3 if parent is expanded and not hidden
  const visibleMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    const visible = metrics.filter((metric) => {
      // Check if node is hidden
      if (hiddenNodes.has(metric.id)) {
        return false;
      }
      if (metric.level === 1 || metric.level === 2) {
        return true;
      }
      // Level 3: only show if parent is expanded
      if (metric.level === 3 && metric.parentId) {
        return expandedMetrics.has(metric.parentId);
      }
      return false;
    });
    return visible;
  }, [metrics, expandedMetrics, hiddenNodes]);

  // Convert visible metrics to React Flow nodes with auto-layout
  const initialNodes = useMemo(() => {
    const nodePositions = calculateNodePositions(visibleMetrics, expandedMetrics);
    
    const nodes = visibleMetrics.map((metric) => {
      const position = nodePositions.get(metric.id) || metric.position;
      const viewNodeInfo = viewNodes.get(metric.id) || {};
      
      // Check if all children are visible
      const allChildren = getChildren(metric.id);
      const visibleChildren = allChildren.filter(child => 
        visibleMetrics.some(m => m.id === child.id)
      );
      const allChildrenVisible = allChildren.length > 0 && allChildren.length === visibleChildren.length;
      
      // Level 2 always has toggle, Level 1 has toggle if it has children that are not all visible
      const hasToggle = metric.level === 2 || (metric.level === 1 && allChildren.length > 0 && !allChildrenVisible);
      
      return {
        id: metric.id,
        type: 'metric',
        position,
        data: { 
          metric,
          isExpanded: expandedMetrics.has(metric.id),
          allChildrenVisible,
          onToggleExpand: hasToggle ? () => toggleExpansion(metric.id) : null,
          onCreateTrendView: () => {
            // Check current state, not captured closure
            const currentViewInfo = viewNodes.get(metric.id) || {};
            if (currentViewInfo.trendViewId) {
              removeViewNode(metric.id, 'trend');
            } else {
              createViewNode(metric.id, 'trend');
            }
          },
          onCreateServiceLineView: () => {
            // Check current state, not captured closure
            const currentViewInfo = viewNodes.get(metric.id) || {};
            if (currentViewInfo.serviceLineViewId) {
              removeViewNode(metric.id, 'serviceLine');
            } else {
              createViewNode(metric.id, 'serviceLine');
            }
          },
          hasTrendView: !!viewNodeInfo.trendViewId,
          hasServiceLineView: !!viewNodeInfo.serviceLineViewId,
        },
        draggable: true,
      };
    });
    
    return nodes;
  }, [visibleMetrics, expandedMetrics, toggleExpansion, viewNodes, createViewNode, removeViewNode]);

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
            type: 'metricEdge',
            animated: true,
            style: { 
              stroke: 'rgba(255, 255, 255, 0.8)', 
              strokeWidth: 2, 
              strokeDasharray: '8,4',
            },
            markerEnd: {
              type: 'arrowclosed',
              color: 'rgba(255, 255, 255, 0.8)',
            },
            data: {
              onRemove: removeChildNode,
            },
          });
        }
      }
    });
    return edges;
  }, [visibleMetrics, removeChildNode]);

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
          const isBudgetGap = metric.id === 'budget-gap';
          const defaultWidth = isBudgetGap ? 500 : 450;
          const defaultHeight = isBudgetGap ? 400 : 350;
          
          // Use saved position/size if available, otherwise use defaults
          const savedSize = viewInfo.trendSize || {
            width: defaultWidth,
            height: defaultHeight,
          };
          
          // Calculate vertical alignment: center the trend chart with the metric card
          // Metric cards are approximately 280px tall (including padding), trend chart default height varies
          const metricCardHeight = 280; // Approximate metric card height
          const trendCardHeight = savedSize.height;
          const verticalOffset = (metricCardHeight - trendCardHeight) / 2;
          
          const savedPosition = viewInfo.trendPosition || {
            x: metricNode.position.x + 320, // Closer to the card (reduced from 350)
            y: metricNode.position.y + verticalOffset, // Vertically centered
          };
          
          viewNodeList.push({
            id: viewInfo.trendViewId,
            type: 'trendView',
            position: savedPosition,
            data: { 
              metric,
              onClose: () => removeViewNode(metricId, 'trend'),
              onPositionChange: (position) => updateViewNodePosition(metricId, 'trend', position),
              onSizeChange: (size) => updateViewNodeSize(metricId, 'trend', size),
            },
            draggable: true,
            style: savedSize,
          });
        }
      }

      if (viewInfo.serviceLineViewId) {
        const metric = metrics.find(m => m.id === metricId);
        if (metric) {
          const defaultWidth = 450;
          const defaultHeight = 350;
          
          // Use saved position/size if available, otherwise use defaults
          const savedSize = viewInfo.serviceLineSize || {
            width: defaultWidth,
            height: defaultHeight,
          };
          
          // Calculate vertical alignment: center the breakdown chart with the metric card
          const metricCardHeight = 280; // Approximate metric card height
          const breakdownCardHeight = savedSize.height;
          const verticalOffset = (metricCardHeight - breakdownCardHeight) / 2;
          
          // If there's a trend view, position below it; otherwise center with metric card
          let yPosition;
          if (viewInfo.trendViewId) {
            // Position below the trend view
            const trendNode = viewNodeList.find(n => n.id === viewInfo.trendViewId);
            if (trendNode) {
              const trendHeight = trendNode.style?.height || (trendNode.data?.metric?.id === 'budget-gap' ? 400 : 350);
              yPosition = trendNode.position.y + trendHeight + 20; // 20px gap
            } else {
              yPosition = metricNode.position.y + verticalOffset;
            }
          } else {
            yPosition = metricNode.position.y + verticalOffset;
          }
          
          const savedPosition = viewInfo.serviceLinePosition || {
            x: metricNode.position.x + 320, // Closer to the card
            y: yPosition,
          };
          
          viewNodeList.push({
            id: viewInfo.serviceLineViewId,
            type: 'serviceLineView',
            position: savedPosition,
            data: { 
              metric,
              onClose: () => removeViewNode(metricId, 'serviceLine'),
              onPositionChange: (position) => updateViewNodePosition(metricId, 'serviceLine', position),
              onSizeChange: (size) => updateViewNodeSize(metricId, 'serviceLine', size),
            },
            draggable: true,
            style: savedSize,
          });
        }
      }
    });

    return [...metricNodes, ...viewNodeList];
  }, [initialNodes, viewNodes, metrics, removeViewNode, expandedMetrics, updateViewNodePosition, updateViewNodeSize]);

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
          // No markerEnd - just a dashed line
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
          // No markerEnd - just a dashed line
        });
      }
    });

    return [...metricEdges, ...viewEdges];
  }, [initialEdges, viewNodes]);

  // Don't use allNodes as initial value - it changes and useNodesState will reset nodes, losing functions
  // Instead, use empty array and manage nodes entirely through our useEffect
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(allEdges);
  const reactFlowInstance = React.useRef(null);
  const hasRestoredPositions = React.useRef(false);

  // Auto-save state to localStorage using React Flow's toObject()
  const autoSaveState = useCallback(() => {
    if (!reactFlowInstance.current) return;

    // Use React Flow's toObject() to get nodes, edges, and viewport
    const flow = reactFlowInstance.current.toObject();
    
    // Combine React Flow state with our custom state
    const state = {
      ...flow, // Contains nodes, edges, and viewport
      expandedMetrics: Array.from(expandedMetrics),
      viewNodes: Array.from(viewNodes.entries()).map(([key, value]) => [key, value]),
      manuallyMovedViewNodes: Array.from(manuallyMovedViewNodes),
      hiddenNodes: Array.from(hiddenNodes),
      snapshotDate: snapshotDate,
    };
    
    saveFullState(currentPage, state);
  }, [expandedMetrics, viewNodes, manuallyMovedViewNodes, hiddenNodes, snapshotDate, currentPage]);

  // Handle node drag - mark view nodes as manually moved during drag
  const handleNodeDrag = useCallback((event, node) => {
    // Check if the drag originated from a resize handle
    const target = event.target;
    if (target && target.closest && target.closest('.trend-view-resize-handle')) {
      return; // Don't handle drag if it's from resize handle
    }
    if (node.type === 'trendView' || node.type === 'serviceLineView') {
      markViewNodeAsMoved(node.id);
    }
  }, [markViewNodeAsMoved]);
  

  // Handle node drag stop - save position for view nodes and auto-save state
  const handleNodeDragStop = useCallback((event, node) => {
    // If it's a view node, save its position to viewNodes state
    if (node.type === 'trendView' || node.type === 'serviceLineView') {
      if (node.data?.onPositionChange) {
        node.data.onPositionChange(node.position);
      }
    }
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
            // If there's a saved position, use it and mark as manually moved
            if (viewInfo.trendPosition) {
              if (trendNode.position.x !== viewInfo.trendPosition.x || trendNode.position.y !== viewInfo.trendPosition.y) {
                trendNode.position = viewInfo.trendPosition;
                hasChanges = true;
              }
              nodesToMarkAsMoved.push(trendNode.id);
            } else {
              // No saved position, use default positioning
              const expectedX = metricNode.position.x + 320;
              const metricCardHeight = 280;
              const trendCardHeight = trendNode.style?.height || (trendNode.data?.metric?.id === 'budget-gap' ? 400 : 350);
              const verticalOffset = (metricCardHeight - trendCardHeight) / 2;
              const expectedY = metricNode.position.y + verticalOffset;
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
        }

        if (viewInfo.serviceLineViewId) {
          const serviceLineNode = updatedNodes.find(n => n.id === viewInfo.serviceLineViewId);
          if (serviceLineNode && !manuallyMovedViewNodes.has(serviceLineNode.id)) {
            // If there's a saved position, use it and mark as manually moved
            if (viewInfo.serviceLinePosition) {
              if (serviceLineNode.position.x !== viewInfo.serviceLinePosition.x || serviceLineNode.position.y !== viewInfo.serviceLinePosition.y) {
                serviceLineNode.position = viewInfo.serviceLinePosition;
                hasChanges = true;
              }
              nodesToMarkAsMoved.push(serviceLineNode.id);
            } else {
              // No saved position, use default positioning
              const defaultHeight = 350;
              const breakdownCardHeight = serviceLineNode.style?.height || defaultHeight;
              const metricCardHeight = 280;
              const verticalOffset = (metricCardHeight - breakdownCardHeight) / 2;
              let expectedY = metricNode.position.y + verticalOffset;
              
              // If there's a trend view, position below it
              if (viewInfo.trendViewId) {
                const trendNode = updatedNodes.find(n => n.id === viewInfo.trendViewId);
                if (trendNode) {
                  const trendHeight = trendNode.style?.height || defaultHeight;
                  expectedY = trendNode.position.y + trendHeight + 20; // 20px gap
                }
              }
              
              const expectedX = metricNode.position.x + 320;
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
    const expandedMetricsKey = Array.from(expandedMetrics).sort().join(',');
    // Include expandedMetrics in structure key to ensure updates when expansion changes
    const nodeStructureKey = `${metricIds}|${viewNodeIds}|${expandedMetricsKey}`;
    
    // Only update if the node structure has actually changed
    if (lastNodeStructureRef.current === nodeStructureKey) {
      return;
    }
    lastNodeStructureRef.current = nodeStructureKey;
    
    // Preserve viewport before node update
    const currentViewport = reactFlowInstance.current?.getViewport();
    
    // Force update nodes when allNodes changes
    // Use the latest allNodes directly to ensure we have fresh data
    setNodes((currentNodes) => {
      // Create a map of existing node positions
      const positionMap = new Map();
      currentNodes.forEach(node => {
        positionMap.set(node.id, node.position);
      });

      // Start with all new nodes from allNodes (which is already up-to-date from the closure)
      // Map over allNodes to preserve all node data including fresh callbacks
      const updatedNodes = allNodes.map(newNode => {
        // For view nodes, position them relative to their metric card only if not manually moved
        if (newNode.type === 'trendView' || newNode.type === 'serviceLineView') {
          // Find the metric node this view belongs to
          const metricId = newNode.id.split('-').slice(0, -1).join('-');
          const metricNode = currentNodes.find(n => n.id === metricId) || allNodes.find(n => n.id === metricId);
          if (metricNode) {
            const existingViewNode = currentNodes.find(n => n.id === newNode.id);
            // If view node already exists, preserve its position and style
            if (existingViewNode) {
              const preservedNode = { ...newNode, position: existingViewNode.position };
              // Preserve style if it exists (contains saved size)
              if (existingViewNode.style) {
                preservedNode.style = existingViewNode.style;
              }
              // If manually moved, we're done
              if (manuallyMovedViewNodes.has(newNode.id)) {
                return preservedNode;
              }
              // Otherwise, continue to check for saved position/size
            }
            
            // Check for saved position/size in viewNodes state (for when toggling back on)
            const viewInfo = viewNodes.get(metricId) || {};
            if (newNode.type === 'trendView' && viewInfo.trendPosition) {
              // Use saved position if available, and mark as manually moved so it doesn't get repositioned
              setTimeout(() => {
                setManuallyMovedViewNodes((prev) => new Set(prev).add(newNode.id));
              }, 0);
              return { 
                ...newNode, 
                position: viewInfo.trendPosition,
                style: viewInfo.trendSize || newNode.style
              };
            }
            if (newNode.type === 'serviceLineView' && viewInfo.serviceLinePosition) {
              // Use saved position if available, and mark as manually moved so it doesn't get repositioned
              setTimeout(() => {
                setManuallyMovedViewNodes((prev) => new Set(prev).add(newNode.id));
              }, 0);
              return { 
                ...newNode, 
                position: viewInfo.serviceLinePosition,
                style: viewInfo.serviceLineSize || newNode.style
              };
            }
            
            // New view node, position relative to metric
            if (newNode.type === 'trendView') {
              // Calculate vertical alignment for trend views
              const metricCardHeight = 280;
              const trendCardHeight = newNode.style?.height || (newNode.data?.metric?.id === 'budget-gap' ? 400 : 350);
              const verticalOffset = (metricCardHeight - trendCardHeight) / 2;
              return { 
                ...newNode, 
                position: { 
                  x: metricNode.position.x + 320, 
                  y: metricNode.position.y + verticalOffset 
                } 
              };
            }
            // Service line views
            if (newNode.type === 'serviceLineView') {
              const defaultHeight = 350;
              const breakdownCardHeight = newNode.style?.height || defaultHeight;
              const metricCardHeight = 280;
              const verticalOffset = (metricCardHeight - breakdownCardHeight) / 2;
              
              // If there's a trend view, position below it
              const trendViewId = viewNodes.get(metricId)?.trendViewId;
              if (trendViewId) {
                const trendNode = currentNodes.find(n => n.id === trendViewId) || allNodes.find(n => n.id === trendViewId);
                if (trendNode) {
                  const trendHeight = trendNode.style?.height || defaultHeight;
                  return { 
                    ...newNode, 
                    position: { 
                      x: metricNode.position.x + 320, 
                      y: trendNode.position.y + trendHeight + 20 // 20px gap below trend
                    } 
                  };
                }
              }
              
              // Otherwise center with metric card
              return { 
                ...newNode, 
                position: { 
                  x: metricNode.position.x + 320, 
                  y: metricNode.position.y + verticalOffset 
                } 
              };
            }
          }
        }
        
        // For metric nodes, preserve existing position if it exists
        // But always use the new node data to ensure callbacks are up to date
        const existingPosition = positionMap.get(newNode.id);
        if (existingPosition && newNode.type === 'metric') {
          // Preserve position but use all other data from newNode (including updated callbacks)
          // Create a completely new object to ensure React Flow sees it as changed
          return { 
            id: newNode.id,
            type: newNode.type,
            position: existingPosition,
            data: { 
              ...newNode.data, // Fresh copy with all callbacks
              // Ensure these are fresh references
              metric: newNode.data.metric,
              isExpanded: newNode.data.isExpanded,
              onToggleExpand: newNode.data.onToggleExpand,
              onCreateTrendView: newNode.data.onCreateTrendView,
              onCreateServiceLineView: newNode.data.onCreateServiceLineView,
              hasTrendView: newNode.data.hasTrendView,
              hasServiceLineView: newNode.data.hasServiceLineView,
            },
            draggable: newNode.draggable,
          };
        }
        // No existing position, use newNode as-is (but ensure it's a new object)
        return { ...newNode };
      });

      // Return only the updated nodes (this removes any nodes that are no longer in allNodes)
      return updatedNodes;
    });
    
    // Restore viewport after node update to prevent zoom/pan shift
    if (currentViewport) {
      // Use setTimeout to ensure the viewport is restored after React Flow has processed the node changes
      setTimeout(() => {
        reactFlowInstance.current?.setViewport(currentViewport);
      }, 0);
    }
  }, [visibleMetrics, viewNodes, setNodes, manuallyMovedViewNodes, allNodes, expandedMetrics]);

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

  // Reset metrics - clear saved state and reset to defaults (without changing zoom/pan)
  const resetView = useCallback(() => {
    // Use the hook's resetState function
    resetState();
    hasRestoredPositions.current = false;
    
    // Force nodes to recalculate positions from initial metric positions
    // Wait for state updates to propagate, then recalculate positions
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
        
        const updatedNodes = currentNodes.map(node => {
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
        
        return updatedNodes;
      });
    }, 200);
  }, [metrics, resetState, setNodes]);

  // Restore flow state on initial load using React Flow's toObject() format
  useEffect(() => {
    const state = loadFullState(currentPage);
    if (!state || !reactFlowInstance.current || hasRestoredPositions.current) return;
    
    try {
      // DON'T restore nodes/edges from localStorage - they don't have function callbacks
      // Instead, let our structure update useEffect handle node creation with fresh callbacks
      // Only restore viewport
      if (state.viewport) {
        setTimeout(() => {
          reactFlowInstance.current?.setViewport(state.viewport);
        }, 200);
      }
      
      hasRestoredPositions.current = true;
    } catch (error) {
      console.error('Error restoring flow state:', error);
    }
  }, [nodes.length, currentPage]); // Run when node count or page changes

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
        <button className="reset-view-btn" onClick={resetView} title="Reset metrics to defaults">
          🔄 Reset Metrics
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
        edgeTypes={edgeTypes}
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
          color="rgba(174, 83, 186, 0.2)"
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.metric?.level === 1) return '#ae53ba';
            if (node.data?.metric?.level === 2) return '#2a8af6';
            return '#ae53ba';
          }}
          maskColor="rgba(10, 14, 39, 0.5)"
        />
        <svg>
          <defs>
            <linearGradient id="edge-gradient">
              <stop offset="0%" stopColor="#ae53ba" />
              <stop offset="100%" stopColor="#2a8af6" />
            </linearGradient>
            <marker
              id="edge-circle"
              viewBox="-5 -5 10 10"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <circle stroke="#2a8af6" strokeOpacity="0.75" r="2" cx="0" cy="0" fill="#2a8af6" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  );
};

export default MetricTree;

