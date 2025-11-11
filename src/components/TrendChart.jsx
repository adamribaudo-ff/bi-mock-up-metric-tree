import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TrendChart = ({ data, width = 200, height = 80, unit = '' }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
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
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('z-index', 1000);

    // Format value for tooltip
    const formatValue = (val) => {
      if (unit === 'USD') {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
        return `$${val.toFixed(0)}`;
      }
      if (unit === '%') return `${val.toFixed(1)}%`;
      return val.toFixed(2);
    };

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map(d => d.month))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.1])
      .nice()
      .range([chartHeight, 0]);

    // Line generator
    const line = d3
      .line()
      .x(d => xScale(d.month) + xScale.bandwidth() / 2)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add area under the line
    const area = d3
      .area()
      .x(d => xScale(d.month) + xScale.bandwidth() / 2)
      .y0(chartHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add area
    g.append('path')
      .datum(data)
      .attr('fill', '#2447A0')
      .attr('fill-opacity', 0.1)
      .attr('d', area);

    // Add line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#2447A0')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots with hover interactions
    const dots = g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.month) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.value))
      .attr('r', 2.5)
      .attr('fill', '#2447A0')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('r', 4)
          .attr('fill', '#122350');
        
        tooltip
          .style('opacity', 1)
          .html(`${d.month}: ${formatValue(d.value)}`)
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
          .attr('r', 2.5)
          .attr('fill', '#2447A0');
        tooltip.style('opacity', 0);
      });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '9px')
      .style('fill', '#666');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(3))
      .selectAll('text')
      .style('font-size', '9px')
      .style('fill', '#666');

    // Style axes
    g.selectAll('.domain, .tick line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1);

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, width, height, unit]);

  return <svg ref={svgRef} width={width} height={height} />;
};

export default TrendChart;

