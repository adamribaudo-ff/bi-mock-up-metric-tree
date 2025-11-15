import React from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import './QuestionNode.css';

const QuestionNode = ({ data, selected }) => {
  return (
    <div className="question-node">
      <div className="question-icon">?</div>
      <div className="question-text">{data.question}</div>
      
      {/* Bottom toolbar for expand/collapse if has children */}
      {data.onToggleExpand && !data.isExpanded && (
        <NodeToolbar 
          isVisible={true} 
          position={Position.Bottom} 
          align="center"
          className="metric-node-toolbar"
        >
          <button
            className="toolbar-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (data.onToggleExpand) data.onToggleExpand();
            }}
            title="Expand children"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </NodeToolbar>
      )}
      
      {/* Source handle at top to connect to parent */}
      <Handle
        type="source"
        position={Position.Top}
        style={{ background: '#7c3aed', width: '8px', height: '8px' }}
      />
      
      {/* Target handle at bottom to receive connections from children */}
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ background: '#7c3aed', width: '8px', height: '8px' }}
      />
    </div>
  );
};

export default QuestionNode;
