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
import MalloyChartNode from './MalloyChartNode';
import QuestionNode from './QuestionNode';
import MetricEdge from './MetricEdge';
import { getMetricsForPage } from '../data/pageMetrics';
import { getNodeChildren, questions } from '../data/metrics';
import { usePage } from '../context/PageContext';
import { useMetricTree } from '../context/MetricTreeContext';
import { useSelectedMetric } from '../context/SelectedMetricContext';
import { useMetricTreeState } from '../hooks/useMetricTreeState';
import { useViewNodeManager } from '../hooks/useViewNodeManager';
import { calculateNodePositions } from '../utils/layoutCalculations';
import { saveFullState, loadFullState } from '../utils/storage';
import './MetricTree.css';

const nodeTypes = {
  metric: MetricNode,
  trendView: TrendViewNode,
  serviceLineView: ServiceLineViewNode,
  malloyChart: MalloyChartNode,
  question: QuestionNode,
};

const edgeTypes = {
  metricEdge: MetricEdge,
};

const MetricTree = () => {
  const { currentPage } = usePage();
  const { registerResetCallback } = useMetricTree();
  const { setSelectedMetric, isShelfOpen, setShelfOpen } = useSelectedMetric();
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

  // Toggle expansion for a node (metric or question)
  const toggleExpansion = useCallback((nodeId) => {
    const allChildren = getNodeChildren(nodeId);
    
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
      
      if (hasHiddenChildren || !prev.has(nodeId)) {
        // Expand if there are hidden children or parent is collapsed
        const next = new Set(prev);
        next.add(nodeId);
        return next;
      } else {
        // All children visible and parent expanded, so collapse
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      }
    });
  }, [hiddenNodes]);

  // Remove a child node and all its descendants by adding them to the hidden set
  const removeChildNode = useCallback((childId, parentId) => {
    // Recursively collect the child and all its descendants
    const nodesToHide = [childId];
    const collectDescendants = (nodeId) => {
      const children = getNodeChildren(nodeId);
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

  // Recursively check if a node should be visible based on ancestor expansion
  const isNodeVisible = useCallback((nodeId, parentId) => {
    // Check if node is explicitly hidden
    if (hiddenNodes.has(nodeId)) {
      return false;
    }
    
    // If no parent, it's a root node - always visible
    if (!parentId) {
      return true;
    }
    
    // Check if parent is expanded
    if (!expandedMetrics.has(parentId)) {
      return false;
    }
    
    // Recursively check parent's visibility
    // Find parent in metrics or questions
    const parentMetric = metrics.find(m => m.id === parentId);
    const parentQuestion = questions.find(q => q.id === parentId);
    const parent = parentMetric || parentQuestion;
    
    if (!parent) {
      return true; // If parent not found, show the node
    }
    
    return isNodeVisible(parentId, parent.parentId);
  }, [metrics, expandedMetrics, hiddenNodes]);

  // Filter visible metrics and questions recursively
  const visibleMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    return metrics.filter((metric) => isNodeVisible(metric.id, metric.parentId));
  }, [metrics, isNodeVisible]);

  const visibleQuestions = useMemo(() => {
    if (currentPage !== 'budget-variance') return [];
    return questions.filter((question) => isNodeVisible(question.id, question.parentId));
  }, [currentPage, isNodeVisible]);

  // Convert visible metrics to React Flow nodes with auto-layout
  const initialNodes = useMemo(() => {
    const nodes = visibleMetrics.map((metric) => {
      const position = metric.position;
      const viewNodeInfo = viewNodes.get(metric.id) || {};
      
      // Check if all children are visible
      const allChildren = getNodeChildren(metric.id);
      const visibleChildren = allChildren.filter(child => 
        visibleMetrics.some(m => m.id === child.id) || visibleQuestions.some(q => q.id === child.id)
      );
      const allChildrenVisible = allChildren.length > 0 && allChildren.length === visibleChildren.length;
      
      // Show toggle if node has children
      const hasToggle = allChildren.length > 0;
      
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
          onInspect: () => {
            setSelectedMetric(metric);
            setShelfOpen(true);
          },
        },
        draggable: true,
      };
    });
    
    return nodes;
  }, [visibleMetrics, visibleQuestions, expandedMetrics, toggleExpansion, viewNodes, createViewNode, removeViewNode]);

  // Create edges - parent to child direction (parent bottom -> child top)
  const initialEdges = useMemo(() => {
    const edges = [];
    
    // Edges from parent metrics/questions to their child metrics
    visibleMetrics.forEach((metric) => {
      if (metric.parentId) {
        // Check if parent is visible (could be a metric or question)
        const parentVisible = visibleMetrics.some(m => m.id === metric.parentId) || 
                            visibleQuestions.some(q => q.id === metric.parentId);
        if (parentVisible) {
          edges.push({
            id: `e${metric.parentId}-${metric.id}`,
            source: metric.id, // Child is source (reversed for arrow direction)
            target: metric.parentId, // Parent is target (reversed for arrow direction)
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
    
    // Edges from parent questions to their child questions
    visibleQuestions.forEach((question) => {
      if (question.parentId) {
        const parentVisible = visibleQuestions.some(q => q.id === question.parentId);
        if (parentVisible) {
          edges.push({
            id: `e${question.parentId}-${question.id}`,
            source: question.id, // Child is source (reversed for arrow direction)
            target: question.parentId, // Parent is target (reversed for arrow direction)
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
          });
        }
      }
    });
    
    return edges;
  }, [visibleMetrics, visibleQuestions, removeChildNode]);

  // Include view nodes and question nodes in the nodes array
  const allNodes = useMemo(() => {
    const metricNodes = initialNodes;
    const viewNodeList = [];
    
    // Add question nodes
    visibleQuestions.forEach((question) => {
      const allChildren = getNodeChildren(question.id);
      const visibleChildren = allChildren.filter(child => 
        visibleMetrics.some(m => m.id === child.id) || visibleQuestions.some(q => q.id === child.id)
      );
      const allChildrenVisible = allChildren.length > 0 && allChildren.length === visibleChildren.length;
      const hasChildren = allChildren.length > 0;
      
      viewNodeList.push({
        id: question.id,
        type: 'question',
        position: question.position,
        data: {
          question: question.text,
          isExpanded: expandedMetrics.has(question.id),
          allChildrenVisible,
          onToggleExpand: hasChildren ? () => toggleExpansion(question.id) : null,
        },
        draggable: true,
      });
    });
    
    // Add view nodes (trend/serviceLine charts)
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

    // Add Malloy chart node for Budget Variance page - HIDDEN FOR NOW
    /*
    if (currentPage === 'budget-variance') {
      viewNodeList.push({
        id: 'malloy-opportunity-chart',
        type: 'malloyChart',
        position: { x: 100, y: 900 }, // Position below the main metrics
        data: {
          label: 'Opportunity Pipeline',
          query: `# viz = bar
run: opportunity -> {
  group_by: opportunity_stage
  aggregate: opportunity_count
}`,
          onClose: () => {
            // Optional: handle close if needed
          },
        },
        draggable: true,
        style: {
          width: 600,
          height: 450,
        },
      });
    }
    */

    return [...metricNodes, ...viewNodeList];
  }, [initialNodes, visibleQuestions, viewNodes, metrics, removeViewNode, expandedMetrics, updateViewNodePosition, updateViewNodeSize, currentPage, toggleExpansion, visibleMetrics]);

  // Include view node edges
  const allEdges = useMemo(() => {
    const metricEdges = initialEdges;
    const viewEdges = [];
    
    // Helper function to determine which handles to use based on node positions
    const getClosestHandles = (sourceNode, targetNode) => {
      if (!sourceNode || !targetNode) return { sourceHandle: null, targetHandle: null };
      
      const sourceX = sourceNode.position.x;
      const sourceY = sourceNode.position.y;
      const targetX = targetNode.position.x;
      const targetY = targetNode.position.y;
      
      // Calculate relative position
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      
      // Determine primary direction (horizontal vs vertical)
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      
      let sourceHandle, targetHandle;
      
      // Choose handles based on which direction is more significant
      if (absX > absY) {
        // Horizontal connection is dominant
        if (dx > 0) {
          // Target is to the right of source
          sourceHandle = 'view-source-right';
          targetHandle = 'left';
        } else {
          // Target is to the left of source
          sourceHandle = 'view-source-left';
          targetHandle = 'right';
        }
      } else {
        // Vertical connection is dominant
        if (dy > 0) {
          // Target is below source
          sourceHandle = 'view-source-bottom';
          targetHandle = 'top';
        } else {
          // Target is above source
          sourceHandle = 'view-source-top';
          targetHandle = 'bottom';
        }
      }
      
      return { sourceHandle, targetHandle };
    };

    viewNodes.forEach((viewInfo, metricId) => {
      const metricNode = allNodes.find(n => n.id === metricId);
      
      if (viewInfo.trendViewId) {
        const trendNode = allNodes.find(n => n.id === viewInfo.trendViewId);
        const { sourceHandle, targetHandle } = getClosestHandles(metricNode, trendNode);
        
        viewEdges.push({
          id: `e${metricId}-${viewInfo.trendViewId}`,
          source: metricId,
          sourceHandle,
          target: viewInfo.trendViewId,
          targetHandle,
          type: 'default',
          animated: false,
          updatable: true,
          style: {
            stroke: '#FFA823',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          // No markerEnd - just a dashed line
        });
      }

      if (viewInfo.serviceLineViewId) {
        const serviceLineNode = allNodes.find(n => n.id === viewInfo.serviceLineViewId);
        const { sourceHandle, targetHandle } = getClosestHandles(metricNode, serviceLineNode);
        
        viewEdges.push({
          id: `e${metricId}-${viewInfo.serviceLineViewId}`,
          source: metricId,
          sourceHandle,
          target: viewInfo.serviceLineViewId,
          targetHandle,
          type: 'default',
          animated: false,
          updatable: true,
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
  }, [initialEdges, viewNodes, allNodes]);

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
      
      // Recalculate edges in real-time during drag
      setEdges((currentEdges) => {
        return currentEdges.map((edge) => {
          // Check if this edge involves the dragged node
          if (edge.target === node.id) {
            // Get current node positions from React Flow
            const currentNodes = reactFlowInstance.current?.getNodes() || [];
            const sourceNode = currentNodes.find(n => n.id === edge.source);
            const targetNode = currentNodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
              const dx = targetNode.position.x - sourceNode.position.x;
              const dy = targetNode.position.y - sourceNode.position.y;
              const absX = Math.abs(dx);
              const absY = Math.abs(dy);
              
              let newSourceHandle, newTargetHandle;
              if (absX > absY) {
                if (dx > 0) {
                  newSourceHandle = 'view-source-right';
                  newTargetHandle = 'left';
                } else {
                  newSourceHandle = 'view-source-left';
                  newTargetHandle = 'right';
                }
              } else {
                if (dy > 0) {
                  newSourceHandle = 'view-source-bottom';
                  newTargetHandle = 'top';
                } else {
                  newSourceHandle = 'view-source-top';
                  newTargetHandle = 'bottom';
                }
              }
              
              return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
            }
          }
          return edge;
        });
      });
    }
  }, [markViewNodeAsMoved, setEdges]);
  

  // Handle node drag stop - save position for view nodes and auto-save state
  const handleNodeDragStop = useCallback((event, node) => {
    // If it's a view node, save its position to viewNodes state
    if (node.type === 'trendView' || node.type === 'serviceLineView') {
      if (node.data?.onPositionChange) {
        node.data.onPositionChange(node.position);
      }
      
      // Recalculate edges for this view node
      setEdges((currentEdges) => {
        return currentEdges.map((edge) => {
          // Check if this edge involves the dragged node
          if (edge.target === node.id) {
            // Get current node positions from React Flow
            const currentNodes = reactFlowInstance.current?.getNodes() || [];
            const sourceNode = currentNodes.find(n => n.id === edge.source);
            const targetNode = currentNodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
              const dx = targetNode.position.x - sourceNode.position.x;
              const dy = targetNode.position.y - sourceNode.position.y;
              const absX = Math.abs(dx);
              const absY = Math.abs(dy);
              
              let newSourceHandle, newTargetHandle;
              if (absX > absY) {
                if (dx > 0) {
                  newSourceHandle = 'view-source-right';
                  newTargetHandle = 'left';
                } else {
                  newSourceHandle = 'view-source-left';
                  newTargetHandle = 'right';
                }
              } else {
                if (dy > 0) {
                  newSourceHandle = 'view-source-bottom';
                  newTargetHandle = 'top';
                } else {
                  newSourceHandle = 'view-source-top';
                  newTargetHandle = 'bottom';
                }
              }
              
              return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
            }
          }
          return edge;
        });
      });
    }
    // Auto-save after a short delay to ensure state is updated
    setTimeout(() => {
      autoSaveState();
    }, 100);
  }, [autoSaveState, setEdges]);

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
      // Start with all new nodes from allNodes (which is already up-to-date from the closure)
      // Map over allNodes to preserve all node data including fresh callbacks
      const updatedNodes = allNodes.map(newNode => {
        // First, check if this exact node exists in currentNodes and preserve position/style
        const existingNode = currentNodes.find(n => n.id === newNode.id);
        
        // If this exact node exists, preserve position but use the NEWER style
        if (existingNode) {
          // For view nodes, prefer the style from allNodes (which comes from state) over currentNodes
          // because state is updated immediately but React Flow's internal nodes lag behind
          const styleToUse = (newNode.type === 'trendView' || newNode.type === 'serviceLineView')
            ? (newNode.style || existingNode.style) // Use new style from allNodes if available
            : (existingNode.style || newNode.style); // For other nodes, preserve existing
            
          const preservedNode = { 
            ...newNode, 
            position: existingNode.position,
            style: styleToUse,
          };
          return preservedNode;
        }
        
        // For NEW view nodes being added, handle positioning
        if (newNode.type === 'trendView' || newNode.type === 'serviceLineView') {
          // Find the metric node this view belongs to
          const metricId = newNode.id.split('-').slice(0, -1).join('-');
          const metricNode = currentNodes.find(n => n.id === metricId) || allNodes.find(n => n.id === metricId);
          if (metricNode) {
            
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
        
        // For NEW metric or question nodes, position based on parent's CURRENT position
        if ((newNode.type === 'metric' || newNode.type === 'question') && !existingNode) {
          const nodeData = newNode.type === 'metric' ? 
            metrics.find(m => m.id === newNode.id) : 
            questions.find(q => q.id === newNode.id);
          
          if (nodeData && nodeData.parentId) {
            const parentNode = currentNodes.find(n => n.id === nodeData.parentId);
            if (parentNode) {
              // Position 300px below parent's CURRENT position to avoid overlap
              return {
                ...newNode,
                position: {
                  x: newNode.position.x,
                  y: parentNode.position.y + 300
                }
              };
            }
          }
        }
        
        // For metric/question nodes, check if existing and preserve position
        if (existingNode && (newNode.type === 'metric' || newNode.type === 'question')) {
          // Preserve position but use all other data from newNode (including updated callbacks)
          // Create a completely new object to ensure React Flow sees it as changed
          return { 
            id: newNode.id,
            type: newNode.type,
            position: existingNode.position,
            data: newNode.type === 'metric' ? { 
              ...newNode.data, // Fresh copy with all callbacks
              // Ensure these are fresh references
              metric: newNode.data.metric,
              isExpanded: newNode.data.isExpanded,
              onToggleExpand: newNode.data.onToggleExpand,
              onCreateTrendView: newNode.data.onCreateTrendView,
              onCreateServiceLineView: newNode.data.onCreateServiceLineView,
              hasTrendView: newNode.data.hasTrendView,
              hasServiceLineView: newNode.data.hasServiceLineView,
            } : newNode.data,
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
          // Level 3 children are collapsed by default
          return false;
        });
        
        // Recalculate positions using calculateNodePositions
        const defaultExpanded = new Set(); // No metrics expanded by default
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

  // Register resetView callback with context
  useEffect(() => {
    registerResetCallback(resetView);
  }, [registerResetCallback, resetView]);

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
        connectionMode="loose"
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

