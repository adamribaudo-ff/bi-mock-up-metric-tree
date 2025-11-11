import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BudgetGapChart = ({ data, width = 280, height = 200 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 50, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tooltip div
    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('background', 'rgba(0, 0, 0, 0.85)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.2)');

    // Format value for display
    const formatValue = (val) => {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
      return `$${val.toFixed(0)}`;
    };

    // Prepare data for stacked bar chart
    const months = data.map(d => d.month);
    const stackKeys = ['securedRevenue', 'actualRevenue', 'identifiedUnsecuredRevenue'];
    
    // Stack the data
    const stack = d3.stack()
      .keys(stackKeys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stack(data);

    // Calculate max value for Y axis (include targets)
    const maxDataValue = d3.max(data, d => 
      d.securedRevenue + d.actualRevenue + d.identifiedUnsecuredRevenue
    );
    const maxTargetValue = d3.max(data, d => d.target || 0);
    const maxValue = Math.max(maxDataValue, maxTargetValue) * 1.15;

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(months)
      .range([0, chartWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([chartHeight, 0]);

    // Color scale for stacked bars
    const colorScale = d3.scaleOrdinal()
      .domain(stackKeys)
      .range(['#2447A0', '#10b981', '#93c5fd']); // Dark blue, green, light blue

    // Create legend
    const legendData = [
      { label: 'Secured Revenue', color: '#2447A0' },
      { label: 'Actual Revenue', color: '#10b981' },
      { label: 'Identified Unsecured Revenue', color: '#93c5fd' },
      { label: 'Target', color: '#f97316' }
    ];

    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, -40)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => {
        // Position legend items in two rows if needed
        const row = i < 2 ? 0 : 1;
        const col = i % 2;
        return `translate(${col * 140}, ${row * 16})`;
      });

    legendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => d.color)
      .attr('rx', 2);

    legendItems.append('text')
      .attr('x', 16)
      .attr('y', 9)
      .style('font-size', '9px')
      .style('fill', '#666')
      .text(d => d.label);

    // Draw stacked bars
    const barGroups = g.selectAll('.bar-group')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('fill', d => colorScale(d.key));

    barGroups.selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.data.month))
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 0.8);
        
        const value = d[1] - d[0];
        const seriesName = d3.select(this.parentNode).datum().key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
        
        tooltip
          .style('opacity', 1)
          .html(`${d.data.month}<br/>${seriesName}: ${formatValue(value)}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 1);
        tooltip.style('opacity', 0);
      });

    // Draw target markers (circles)
    const targetCircles = g.selectAll('.target-circle')
      .data(data.filter(d => d.target !== undefined))
      .enter()
      .append('circle')
      .attr('class', 'target-circle')
      .attr('cx', d => xScale(d.month) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.target))
      .attr('r', 4)
      .attr('fill', '#f97316')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('r', 5.5);
        
        tooltip
          .style('opacity', 1)
          .html(`${d.month}<br/>Target: ${formatValue(d.target)}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 4);
        tooltip.style('opacity', 0);
      });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#666');

    // Y axis with formatted currency
    g.append('g')
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => {
          if (d >= 1000000) return `$${(d / 1000000).toFixed(1)}M`;
          if (d >= 1000) return `$${(d / 1000).toFixed(0)}k`;
          return `$${d}`;
        }))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#666');

    // Style axes
    g.selectAll('.domain, .tick line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1);

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

export default BudgetGapChart;

