import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const NODE_RADIUS = 28;

export default function GraphViz({ graphData, traversalLog = [], traversalStep = 0, onNodeClick, height = 500, currentUserId }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes?.length) return;
    const { nodes, edges } = graphData;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current?.clientWidth || 800;
    const h = height;

    svg.attr('width', width).attr('height', h);

    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.2, 3]).on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoom);

    const simNodes = nodes.map(n => ({ ...n, x: width / 2, y: h / 2 }));
    const nodeById = {};
    simNodes.forEach(n => { nodeById[n.id.toString()] = n; });

    const simLinks = edges.map(e => ({
      source: nodeById[e.source.toString()],
      target: nodeById[e.target.toString()],
    })).filter(l => l.source && l.target);

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).distance(140).strength(0.7))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, h / 2))
      .force('collision', d3.forceCollide(60))
      .alphaDecay(0.01)
      .alphaTarget(0.01);

    simRef.current = simulation;

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke', 'var(--cream-border)')
      .attr('stroke-width', 2)
      .attr('opacity', 0.6);

    // Node groups
    const node = g.append('g')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .attr('class', 'graph-node')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => onNodeClick && onNodeClick(d.id))
      .call(d3.drag()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Node circles with tooltip title
    node.append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', 'white')
      .attr('stroke', 'var(--cream-border)')
      .attr('stroke-width', 2)
      .append('title')
      .text(d => `${d.username || d.displayName}\nConnections: ${d.degree || '?'}`);

    // Labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 9)
      .attr('font-weight', 700)
      .attr('fill', '#6B6560')
      .style('pointer-events', 'none')
      .text(d => {
        const label = d.username || d.displayName || d.id.toString();
        const isYou = d.id?.toString() === currentUserId;
        const base = label.length > 9 ? label.slice(0, 8) + '…' : label;
        return isYou ? `${base} (You)` : base;
      });

    simulation.on('tick', () => {
      g.selectAll('.graph-link')
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      g.selectAll('.graph-node').attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData]);

  // Bug Fix 2: Reliable BFS/DFS Animation
  useEffect(() => {
    if (!graphData || !graphData.nodes) return;
    
    const svg = d3.select(svgRef.current);
    if (!traversalLog || traversalLog.length === 0) {
      // Reset State
      svg.selectAll('.graph-node circle')
        .transition().duration(300)
        .attr('fill', 'white')
        .attr('stroke', 'var(--cream-border)')
        .attr('stroke-width', 2);
      
      svg.selectAll('.graph-link')
        .transition().duration(300)
        .attr('stroke', 'var(--cream-border)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', null);
      return;
    }

    const currentSteps = traversalLog.slice(0, traversalStep);
    const visitedSet = new Set();
    const discoveredSet = new Set();
    const processedSet = new Set();
    const activeEdges = new Set();
    const pathNodes = new Set();
    const pathEdges = new Set();

    currentSteps.forEach((step) => {
      const nid = step.node.toString();
      if (step.action === 'visit' || step.action === 'processing' || step.action === 'settle') visitedSet.add(nid);
      if (step.action === 'enqueue' || step.action === 'discovery' || step.action === 'neighbor' || step.action === 'explore' || step.action === 'relax') discoveredSet.add(nid);
      if (step.action === 'processed' || step.action === 'finish' || step.action === 'backtrack') processedSet.add(nid);
      
      if (step.action === 'path') {
        pathNodes.add(nid);
        if (step.from) {
          pathEdges.add([step.from.toString(), nid].sort().join('-'));
        }
      }

      if (step.from && step.node && step.action !== 'path') {
        activeEdges.add([step.from.toString(), step.node.toString()].sort().join('-'));
      }
    });

    const currentNode = traversalLog[traversalStep - 1]?.node?.toString();

    svg.selectAll('.graph-node').each(function(d) {
      const circle = d3.select(this).select('circle');
      const nid = d.id.toString();
      const isCurrent = nid === currentNode;
      const isOnPath = pathNodes.has(nid);
      const isYou = nid === currentUserId;
      
      // Palette: Visiting #1D9E75, Discovered #EF9F27, Processed #639922, Path #D85A30
      let fill = 'white';
      let stroke = isYou ? '#D85A30' : 'var(--cream-border)';
      
      if (isOnPath) { fill = '#D85A30'; stroke = '#a84525'; }
      else if (processedSet.has(nid)) { fill = '#639922'; stroke = '#4a731a'; }
      else if (visitedSet.has(nid)) { fill = '#1D9E75'; stroke = '#157557'; }
      else if (discoveredSet.has(nid)) { fill = '#EF9F27'; stroke = '#c6841e'; }

      if (isCurrent && !isOnPath) {
        fill = '#1D9E75';
        stroke = '#157557';
      }

      circle.transition().duration(250)
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', isCurrent || isOnPath || isYou ? 6 : 2);
    });

    svg.selectAll('.graph-link').each(function(d) {
      const line = d3.select(this);
      const sid = d.source.id.toString();
      const tid = d.target.id.toString();
      const edgeKey = [sid, tid].sort().join('-');
      const isActive = activeEdges.has(edgeKey);
      const isPathEdge = pathEdges.has(edgeKey);
      
      line.transition().duration(250)
        .attr('stroke', isPathEdge ? '#D85A30' : (isActive ? '#1D9E75' : 'var(--cream-border)'))
        .attr('stroke-width', isPathEdge ? 4 : (isActive ? 2.5 : 2));
      
      if (isActive || isPathEdge) {
        line.attr('stroke-dasharray', '5,5').style('animation', 'dash 1s linear infinite');
      } else {
        line.attr('stroke-dasharray', null).style('animation', 'none');
      }
    });

  }, [traversalStep, traversalLog, graphData]);

  return (
    <div ref={containerRef} style={{ position: 'relative', background: 'var(--cream)', borderRadius: 16, border: '1px solid var(--cream-border)', overflow: 'hidden', minHeight: '500px' }}>
       <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -10; }
        }
      `}</style>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
