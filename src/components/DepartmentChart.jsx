import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const DepartmentChart = ({ data, width = 200, height = 80 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 40, left: 30 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map(d => d.department))
      .range([0, chartWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.1])
      .nice()
      .range([chartHeight, 0]);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.department))
      .range(['#2447A0', '#122350', '#CCD7F3', '#2447A0', '#122350']);

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.department))
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.value))
      .attr('height', d => chartHeight - yScale(d.value))
      .attr('fill', d => colorScale(d.department));

    // Add value labels on bars
    g.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => xScale(d.department) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => d.value);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '9px')
      .style('fill', '#666')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em');

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
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

export default DepartmentChart;

