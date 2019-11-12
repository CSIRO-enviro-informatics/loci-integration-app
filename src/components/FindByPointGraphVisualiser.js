import React, { createRef, useState, Component } from 'react'
import * as d3 from 'd3'

import {    
    Link    
  } from "react-router-dom";

 
export default class FindByPointGraphVisualiser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      graphData: this.props.graphData
    }
  }
  
  componentDidMount() {
    this.updateGraph();
  }
  componentDidUpdate(){
    if(this.state.graphData != this.props.graphData) {
      this.setState({
        graphData: this.props.graphData
      });
      d3.selectAll(".graphcontainer svg > *").remove();
      d3.selectAll(".graphcontainer .graphtooltip").remove();
    }

  }
  updateGraph() {
    const data = this.state.graphData;
    
      
      const width = 640,
            height = 480;
      
      //Initializing chart
      const chart = d3.select('.chart')
        .attr('width', width)
        .attr('height', height);
      
      //Creating tooltip
      //const tooltip = d3.select('.graphcontainer')
      //  .append('div')
       // .attr('class', 'graphtooltip')
       // .html('Tooltip');

      const graphconsole = d3.select('.graphconsole');
      
      //Initializing force simulation
      const simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d =>         
          d.name).distance(10))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('collide', d3.forceCollide().radius(d => d.r * 10))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force("y", d3.forceY(0))
        .force("x", d3.forceX(0));
      
      
      //Drag functions
      const dragStart = d => {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        
      };
      
      const drag = d => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      };
      
      const dragEnd = d => {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
       

        
      }
      
      //Creating links
      const link = chart.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links).enter()
        .append('line');
      
      //Creating nodes
      const node =  chart.append('g')
        .attr('class', 'node')
        .selectAll('circle')
        .data(data.nodes).enter(function(d){
          if(d.label == 'root') {
           d.fixed=true;
          }
        })
        .append('circle')
        .attr('r', 5)
        .attr('class', function(d){
            if(d.name == "root") {
              return 'root';
            }
            if(d.label == 'within'){
              return 'within'
            }
            if(d.label == 'overlap'){
              return 'overlap'
            }
            return 'graphnode';
        })
        .call(d3.drag()
           .on('start', dragStart)
           .on('drag', drag)
           .on('end', dragEnd)
        ).on('mouseover', d => {
          console.log(d.label);
          console.log(d.name);
          console.log(d3.event.pageX);
          graphconsole.html(d.label);
          //tooltip.html(d.label)
          //  .style('left', d3.event.pageX - 1000 +'px')
          //  .style('top', d3.event.pageY  + 'px')
          //  .style('opacity', .9);
        }).on('mouseout', () => {
        //  tooltip.style('opacity', 0)
        //    .style('left', '0px')
        //    .style('top', '0px');

        }).on('dblclick',d => {
          d3.event.preventDefault();
          console.log("Double click");
          console.log(d);
        });
      
      //Setting location when ticked
      const ticked = () => {
        link
          .attr("x1", d => { 
            if(d.label == 'root') {
              d.x = width / 2;
              d.y = height /2;
              return d.x;
            }
            return d.source.x; 
          })
          .attr("y1", d => { 
            if(d.label == 'root') {
              d.x = width / 2;
              d.y = height /2;
              return d.y;
            }
            
            return d.source.y; 

          })
          .attr("x2", d => { 
            if(d.label == 'root') {
              d.x = width / 2;
              d.y = height /2;
              return d.x;
            }
            return d.target.x; 
          })
          .attr("y2", d => { 
            if(d.label == 'root') {
              d.x = width / 2;
              d.y = height /2;
              return d.y;
            }
            return d.target.y; 
          });

        node
        .attr("cx", function(d) { 
          
          return d.x; 
        })
        .attr("cy", function(d) { 
          
          return d.y; 
        });
      };
      
      //Starting simulation
      simulation.nodes(data.nodes)
        .on('tick', ticked);
      var link_force =  d3.forceLink(data.links)
        .id(function(d) { return d.name; })

      simulation.force("links",link_force)
      
        
  }
  
  render() {
    var graphData = this.state.graphData;
    console.log(graphData);
    this.updateGraph();
    return (
      <div className='graphcontainer'>
        <div className="graphconsole"></div>
        <div className='chartContainer'>
          <svg className='chart'>
          </svg>
        </div>
      </div>
    ); 
  }
  }