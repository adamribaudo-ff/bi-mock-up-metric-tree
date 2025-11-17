import { useState, useRef, useEffect } from 'react';
import { useSelectedMetric } from '../context/SelectedMetricContext';
import MetricDetail from './MetricDetail';
import TrendCard from './TrendCard';
import BreakdownCard from './BreakdownCard';
import CombinedCard from './CombinedCard';
import DraggableCard from './DraggableCard';
import './RightShelf.css';

// Separate trend button component
const TrendButtonSeparate = ({ metric, isFromBreakdown = false, breakdownType = null }) => {
  const { addTrendToHistory, addCombinedToHistory } = useSelectedMetric();
  
  const handleTrendClick = () => {
    if (isFromBreakdown && breakdownType) {
      addCombinedToHistory(metric, breakdownType);
    } else {
      addTrendToHistory(metric);
    }
  };

  return (
    <div className="trend-button-separate">
      <button className="trend-btn-separate" onClick={handleTrendClick} title={isFromBreakdown ? "Show breakdown trend" : "Show trend"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
        <span>View Trend</span>
      </button>
    </div>
  );
};

// Separate breakdown button component
const BreakdownButtonSeparate = ({ metric, isFromTrend = false }) => {
  const { addBreakdownToHistory, addCombinedToHistory } = useSelectedMetric();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const breakdownOptions = [
    { id: 'dealSize', label: 'Deal Size' },
    { id: 'accountAge', label: 'Account Age' },
    { id: 'opportunitySize', label: 'Opportunity Size' }
  ];

  const handleBreakdownSelect = (breakdownType) => {
    if (isFromTrend) {
      addCombinedToHistory(metric, breakdownType);
    } else {
      addBreakdownToHistory(metric, breakdownType);
    }
    setShowDropdown(false);
  };

  return (
    <div className="breakdown-button-separate">
      <button 
        className="breakdown-btn-separate" 
        onClick={() => setShowDropdown(!showDropdown)} 
        title={isFromTrend ? "Show breakdown trend" : "Show breakdown"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <rect x="7" y="7" width="3" height="9"></rect>
          <rect x="14" y="7" width="3" height="5"></rect>
        </svg>
        <span>View Breakdown</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      
      {showDropdown && (
        <div className="breakdown-dropdown">
          {breakdownOptions.map((option) => (
            <button
              key={option.id}
              className="breakdown-dropdown-item"
              onClick={() => handleBreakdownSelect(option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RightShelf = () => {
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const { 
    metricHistory, 
    clearHistory, 
    removeFromHistory, 
    isShelfOpen, 
    setShelfOpen, 
    draggedCards, 
    droppedCards, 
    setCardDragging 
  } = useSelectedMetric();
  const shelfRef = useRef(null);

  const toggleShelf = () => {
    setShelfOpen(!isShelfOpen);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      // Min width 300px, max width 800px
      if (newWidth >= 300 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <>
      {/* Shelf */}
      <div 
        ref={shelfRef}
        className={`right-shelf ${isShelfOpen ? 'open' : ''}`}
        style={{ width: `${width}px` }}
      >
        {isShelfOpen && (
          <div 
            className="right-shelf-resize-handle"
            onMouseDown={handleMouseDown}
          />
        )}
        
        <button 
          className="right-shelf-toggle"
          onClick={toggleShelf}
          aria-label={isShelfOpen ? 'Close shelf' : 'Open shelf'}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isShelfOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          >
            <path 
              d="M12.5 5L7.5 10L12.5 15" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        <div className="right-shelf-content">
          {metricHistory.length === 0 ? (
            <div className="metric-detail-empty">
              <p>Select metric cards to view their details</p>
            </div>
          ) : (
            <div className="metric-history">
              {metricHistory
                .filter(item => !droppedCards.has(item.timestamp))
                .map((item, index) => {
                const isTopCard = index === 0;
                const showButtons = isTopCard && (item.type === 'metric' || item.type === 'trend' || item.type === 'breakdown');
                const isDragging = draggedCards.has(item.timestamp);
                
                return (
                  <div key={`${item.id}-${item.timestamp}`} className={`metric-history-item ${isDragging ? 'dragging-placeholder' : ''}`}>
                    {showButtons && (
                      <div className="top-buttons-container">
                        {item.type === 'metric' && (
                          <>
                            <TrendButtonSeparate metric={item} />
                            <BreakdownButtonSeparate metric={item} />
                          </>
                        )}
                        {item.type === 'trend' && (
                          <BreakdownButtonSeparate metric={item} isFromTrend={true} />
                        )}
                        {item.type === 'breakdown' && (
                          <TrendButtonSeparate metric={item} isFromBreakdown={true} breakdownType={item.breakdownType} />
                        )}
                      </div>
                    )}
                    <div className="card-container">
                      <button 
                        className="remove-card-btn" 
                        onClick={() => removeFromHistory(item.timestamp)}
                        title="Remove from log"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 3L3 9M3 3L9 9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {item.type === 'trend' ? (
                        <DraggableCard 
                          dragData={{
                            cardType: 'TrendCard',
                            metric: item,
                            timestamp: item.timestamp
                          }}
                          onDragStart={() => setCardDragging(item.timestamp, true)}
                          onDragEnd={() => setCardDragging(item.timestamp, false)}
                        >
                          <TrendCard metric={item} />
                        </DraggableCard>
                      ) : item.type === 'breakdown' ? (
                        <DraggableCard 
                          dragData={{
                            cardType: 'BreakdownCard',
                            metric: item,
                            breakdownType: item.breakdownType,
                            timestamp: item.timestamp
                          }}
                          onDragStart={() => setCardDragging(item.timestamp, true)}
                          onDragEnd={() => setCardDragging(item.timestamp, false)}
                        >
                          <BreakdownCard metric={item} breakdownType={item.breakdownType} />
                        </DraggableCard>
                      ) : item.type === 'combined' ? (
                        <DraggableCard 
                          dragData={{
                            cardType: 'CombinedCard',
                            metric: item,
                            breakdownType: item.breakdownType,
                            timestamp: item.timestamp
                          }}
                          onDragStart={() => setCardDragging(item.timestamp, true)}
                          onDragEnd={() => setCardDragging(item.timestamp, false)}
                        >
                          <CombinedCard metric={item} breakdownType={item.breakdownType} />
                        </DraggableCard>
                      ) : (
                        <DraggableCard 
                          dragData={{
                            cardType: 'MetricDetail',
                            metric: item,
                            timestamp: item.timestamp
                          }}
                          onDragStart={() => setCardDragging(item.timestamp, true)}
                          onDragEnd={() => setCardDragging(item.timestamp, false)}
                        >
                          <MetricDetail metric={item} showTrendButton={false} />
                        </DraggableCard>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RightShelf;
