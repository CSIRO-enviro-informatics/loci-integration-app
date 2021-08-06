// @flow

import React, { createRef, useState, Component } from 'react'
import {    
  Link    
} from "react-router-dom";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import TemporalOperationBySingleTimePoint from './temporal/TemporalOperationBySingleTimePoint';
import ViewFeaturePointInTime from './temporal/ViewFeaturePointInTime';


export default class SearchResultWidget extends Component {
  constructor(props) {
    super(props)

    this.state = {
      query: this.props.query,
      queryResults: null,
      queryTimeElapsed: null,
      isLoading: false,
      mode: null,
      showCurrentResults: true,
      showTemporalAPIForm: false
    }    
  }  

  componentDidMount() {
    this.setState({
      query: this.props.query,
      isLoading: true
    })
    this.search(this.props.query);
  }

  componentDidUpdate(){
    if(this.props.query != this.state.query) {
      this.setState({
        query: this.props.query,
        isLoading: true
      })
      this.search(this.props.query);
    }
  }

  formatResults(r) {
    console.log(r);
    this.setState({
      hitCount: r.length
    })
    return r
  }
  
  formatSummaryStat(){
    if(this.state.hitCount == null) {
      return <p/>
    }
    if(this.state.hitCount == 0) {
      return <p>No results found.</p>
    }
    var count = this.state.hitCount;
    if (count > 10 ){
      count = 10;
    }
    return <p>{this.state.hitCount} results ({this.state.queryTimeElapsed} milliseconds). Showing results 1-{count}.</p>
  }

  search(query) {
    console.log("Search query: " + query)
    //TODO: Replace the following env var with the deployed externally online version when that's ready
    //right now, it depends on an instance of the loci-integration-api deployed locally with ES 
    //and an index populated with <location, label> tuples
    fetch(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT + "/location/find-by-label?query=" + query)
        .then(res => res.json())
        .then(
          (result) => {
            this.setState({
              queryResults: this.formatResults(result),
              isLoading: false
            });
          },
          // Note: it's important to handle errors here
          // instead of a catch() block so that we don't swallow
          // exceptions from actual bugs in components.
          (error) => {
            this.setState({  
              isLoading: false,            
              error
            });
          }
        )
  }

  validateHandler = () => {
    console.log(this.queryString.current)
  }

  run_callback = (item) => {
    console.log("Search result clicked: " + item._source.uri); 
    this.props.renderResultSummaryFn(item._source.uri)
  }
  handleSelect(eventKey, event) {
    console.log(eventKey); 
    console.log(event); 
  }

  doSomething = (item, view) => {
    console.log("doSomething..."); 
    console.log(item); 
    console.log(view); 
  }

  

findTemporalOperationSingleTimePointCallback = (e, item_uri, operation) => {
  console.log("findTemporalOperationSingleTimePointCallback: " + item_uri); 
  var mode = "FIND_TEMPORAL_INTERSECTION_SINGLE_POINT";
  if(operation == 'intersects') {
    mode = "FIND_TEMPORAL_INTERSECTION_SINGLE_POINT";
  }
  else if(operation == 'contains') {
    mode = "FIND_TEMPORAL_CONTAINS_SINGLE_POINT";
  }
  else if(operation == 'within') {
    mode = "FIND_TEMPORAL_WITHIN_SINGLE_POINT";
  }
  this.setState({
    currentTemporalFeatureURI: item_uri,
    showCurrentResults: false,
    showTemporalAPIForm: true,
    spatialOperation: operation,
    mode: mode
  });
}
findTemporalIntersectionDiffTimePointCallback = (e, item_uri) => {
  console.log("findTemporalIntersectionDiffTimePointCallback: " + item_uri); 
}

findTemporalIntersectionTimeSpanPointCallback = (e, item_uri) => {
  console.log("findTemporalIntersectionTimeSpanPointCallback: " + item_uri); 
}

viewFeatureGetPointInTimeCallback = (e, item_uri) => {
  console.log("viewFeatureGetPointInTimeCallback: " + item_uri); 
  this.setState({
    currentTemporalFeatureURI: item_uri,
    showCurrentResults: false,
    showTemporalAPIForm: true,
    mode: "VIEW_FEATURE_GET_POINT_IN_TIME"
  });
}

viewFeatureGetAcrossTimeCallback = (e, item_uri) => {
  console.log("viewFeatureGetAcrossTimeCallback: " + item_uri); 
}

viewFeatureCallback = (e, item_uri) => {
  console.log("viewFeatureCallback: " + item_uri); 
  //this.props.renderResultSummaryFn(item_uri)
}

  showCurrentResults = () => {
    this.setState({
      showCurrentResults: true,
      showTemporalAPIForm: false
    })
    console.log("in showCurrentResults")
  }

  render() {
    console.log(this.state.queryResults)
    var hits = null;    
    var spinner = (<div><img src="/spinner.gif"/></div>)
    var here = this;

    var divToDisplay;
    if(this.state.isLoading) {
      divToDisplay = spinner;
    }
    else {

      if(this.state.showTemporalAPIForm) {
        if(this.state.mode == 'VIEW_FEATURE_GET_POINT_IN_TIME') {
          return (<ViewFeaturePointInTime showCurrentResults={this.showCurrentResults} 
            renderSelectedGeometryFn={here.props.renderSelectedGeometryFn} 
            renderComparisonGeometryFn={here.props.renderComparisonGeometryFn}            
            featureURI={this.state.currentTemporalFeatureURI}/>)  
        } 
        if(this.state.mode == 'FIND_TEMPORAL_INTERSECTION_SINGLE_POINT') {
          return (<TemporalOperationBySingleTimePoint showCurrentResults={this.showCurrentResults} 
            operation="intersects"
            renderSelectedGeometryFn={here.props.renderSelectedGeometryFn}  
            renderComparisonGeometryFn={here.props.renderComparisonGeometryFn}            
            featureURI={this.state.currentTemporalFeatureURI}/>)  
        }  
        if(this.state.mode == 'FIND_TEMPORAL_CONTAINS_SINGLE_POINT') {
          return (<TemporalOperationBySingleTimePoint showCurrentResults={this.showCurrentResults} 
            operation="contains"
            renderSelectedGeometryFn={here.props.renderSelectedGeometryFn}  
            renderComparisonGeometryFn={here.props.renderComparisonGeometryFn}            
            featureURI={this.state.currentTemporalFeatureURI}/>)  
        }  
        if(this.state.mode == 'FIND_TEMPORAL_WITHIN_SINGLE_POINT') {
          return (<TemporalOperationBySingleTimePoint showCurrentResults={this.showCurrentResults} 
            operation="within"
            renderSelectedGeometryFn={here.props.renderSelectedGeometryFn}  
            renderComparisonGeometryFn={here.props.renderComparisonGeometryFn}            
            featureURI={this.state.currentTemporalFeatureURI}/>)  
        }  
      }
      else {
        if(this.state.queryResults) {
          this.state.queryResults.sort(function(a, b) {
            if (a.uri < a.uri) return -1;
            if (a.uri > a.uri) return 1;
            return 0;
          });

          hits = this.state.queryResults.map((item) => (
                    <div className="search-result-block" key={item.uri}> 
                      <div className="search-result-label">{item.match} &nbsp; </div>
                      <div>{item.uri}</div>
                      <div className="search-result-links"> 
                          <ButtonToolbar>
                            <DropdownButton  onSelect={here.handleSelect.bind(this)} onSelect={here.doSomething(item, 'application/json')} id="dropdown-basic-button" 
                                  size="sm" variant="outline-primary" title="View feature">
                              <Dropdown.Item eventKey="viewFeatureGetPointInTime" onClick={(e) => here.viewFeatureGetPointInTimeCallback(e, item['uri'])}>Find at a point in time</Dropdown.Item>                            
                            </DropdownButton>  
                            <DropdownButton  onSelect={here.handleSelect.bind(this)} onSelect={here.doSomething(item, 'application/json')} id="dropdown-basic-button" 
                                  size="sm" variant="outline-primary" title="Find by spatial operation">
                              <Dropdown.Item eventKey="1" onClick={(e) => here.findTemporalOperationSingleTimePointCallback(e, item['uri'], 'intersects')}>Intersect at single time point</Dropdown.Item>                    
                              <Dropdown.Item eventKey="1" onClick={(e) => here.findTemporalOperationSingleTimePointCallback(e, item['uri'], 'contains')}>Contains at single time point</Dropdown.Item>                    
                              <Dropdown.Item eventKey="1" onClick={(e) => here.findTemporalOperationSingleTimePointCallback(e, item['uri'], 'within')}>Within at single time point</Dropdown.Item>             
                            </DropdownButton>                          
                          </ButtonToolbar>
                      </div>
                    </div>
                  )
                );
                      /* <Dropdown.Item eventKey="2" onClick={(e) => here.findTemporalIntersectionDiffTimePointCallback(e, item['uri'])}>Different time points</Dropdown.Item>
                              <Dropdown.Item eventKey="3" onClick={(e) => here.findTemporalIntersectionTimeSpanPointCallback(e, item['uri'])}>Time span</Dropdown.Item>*/

          }
      }
  
      divToDisplay = (<div>
               {this.formatSummaryStat()}
                {hits}         
      </div>)
    }
    return (
      <Container fluid='true'>        
        <Row>
          <Col sm={12}  className="fullheight-results-main">
                {divToDisplay}
          </Col>
        </Row>
      </Container>
    )
  }
}