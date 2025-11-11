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
import { metrics, getChildren } from '../data/metrics';
import './MetricTree.css';

const nodeTypes = {
  metric: MetricNode,
  trendView: TrendViewNode,
  serviceLineView: ServiceLineViewNode,
};

const MetricTree = () => {
  // Track which level 2 metrics are expanded
  // Default to having Sales Pipeline expanded
  const [expandedMetrics, setExpandedMetrics] = useState(new Set(['sales-pipeline']));
  
  // Track which view nodes exist (trend and service line views)
  const [viewNodes, setViewNodes] = useState(new Map()); // Map<metricId, { trendViewId?, serviceLineViewId? }>

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
  }, [expandedMetrics]);

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
      
      if (viewType === 'trend') {
        delete existing.trendViewId;
      } else {
        delete existing.serviceLineViewId;
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

  // Update view node positions relative to their metric cards
  useEffect(() => {
    setNodes((currentNodes) => {
      const updatedNodes = [...currentNodes];
      let hasChanges = false;

      viewNodes.forEach((viewInfo, metricId) => {
        const metricNode = updatedNodes.find(n => n.id === metricId);
        if (!metricNode) return;

        if (viewInfo.trendViewId) {
          const trendNode = updatedNodes.find(n => n.id === viewInfo.trendViewId);
          if (trendNode) {
            const newX = metricNode.position.x + 350;
            const newY = metricNode.position.y;
            if (trendNode.position.x !== newX || trendNode.position.y !== newY) {
              trendNode.position = { x: newX, y: newY };
              hasChanges = true;
            }
          }
        }

        if (viewInfo.serviceLineViewId) {
          const serviceLineNode = updatedNodes.find(n => n.id === viewInfo.serviceLineViewId);
          if (serviceLineNode) {
            const yOffset = viewInfo.trendViewId ? 180 : 0;
            const newX = metricNode.position.x + 350;
            const newY = metricNode.position.y + yOffset;
            if (serviceLineNode.position.x !== newX || serviceLineNode.position.y !== newY) {
              serviceLineNode.position = { x: newX, y: newY };
              hasChanges = true;
            }
          }
        }
      });

      return hasChanges ? updatedNodes : currentNodes;
    });
  }, [nodes, viewNodes, setNodes]);

  // Update nodes and edges when they change, preserving existing positions
  useEffect(() => {
    setNodes((currentNodes) => {
      // Create a map of existing node positions
      const positionMap = new Map();
      currentNodes.forEach(node => {
        positionMap.set(node.id, node.position);
      });

      // Merge new nodes with existing positions
      return allNodes.map(newNode => {
        // For view nodes, always position them relative to their metric card
        if (newNode.type === 'trendView' || newNode.type === 'serviceLineView') {
          // Find the metric node this view belongs to
          const metricId = newNode.id.split('-').slice(0, -1).join('-');
          const metricNode = currentNodes.find(n => n.id === metricId) || allNodes.find(n => n.id === metricId);
          if (metricNode) {
            const existingViewNode = currentNodes.find(n => n.id === newNode.id);
            // If view node already exists and was manually moved, preserve its position
            // Otherwise, position it relative to the metric card
            if (existingViewNode && existingViewNode.position) {
              const expectedX = metricNode.position.x + 350;
              const expectedY = newNode.type === 'trendView' 
                ? metricNode.position.y 
                : (viewNodes.get(metricId)?.trendViewId ? metricNode.position.y + 180 : metricNode.position.y);
              // Only update if it's close to the expected position (wasn't manually moved)
              const distance = Math.sqrt(
                Math.pow(existingViewNode.position.x - expectedX, 2) + 
                Math.pow(existingViewNode.position.y - expectedY, 2)
              );
              if (distance < 50) {
                // Position is close to expected, update it
                return { ...newNode, position: { x: expectedX, y: expectedY } };
              }
              // User moved it, preserve position
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
  }, [allNodes, setNodes, viewNodes]);

  useEffect(() => {
    setEdges(allEdges);
  }, [allEdges, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="metric-tree-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        fitView={false}
        attributionPosition="bottom-left"
        panOnScroll={false}
        zoomOnScroll={false}
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

