// @flow

import React, { createRef, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import FindByPointWithinsResults from './FindByPointWithinsResults'
import FindByPointOverlapResults from './FindByPointOverlapResults'
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import FindByPointGraphVisualiser from './FindByPointGraphVisualiser';
import Button from "react-bootstrap/Button";
import TemporalOperationBySingleTimePoint from './temporal/TemporalOperationBySingleTimePoint';
import ViewFeaturePointInTime from './temporal/ViewFeaturePointInTime';
import ButtonToolbar from "react-bootstrap/ButtonToolbar";


export default class FindByPointResults extends Component {
  constructor(props) {
    super(props)
    var graphData = { "nodes": [], "links": [] };

    this.state = {
      locations: this.props.locations,
      orig_locations: {},
      withins_lookup: {},
      isLoading: false,
      latlng: this.props.latlng,
      contextLocationLookups: {},
      graphData: graphData,
      currGeom: undefined,
      jobqueue: {},
      isGraphLoading: false,
      arrDivs: [],
      regionTypes: [],
      regionTypeFilter: [],
      updateResultList: false,
      filteredLocations: {},
      usefilteredLocations: false,
      findByLocationError: false,
      isWaiting: false,
      showCurrentResults: false,
      showTemporalAPIForm: false,
      currentTemporalFeatureURI: null
    }
    this.updateWithins = this.updateWithins.bind(this);
    this.updateLocations = this.updateLocations.bind(this);
  }
  componentDidMount() {
    this.setState({
      contextLocationLookups: {}
    });
  }


  componentDidUpdate() {
    var graphData = { "nodes": [], "links": [] };

    if (this.props.latlng != this.state.latlng) {
      this.setState({
        latlng: this.props.latlng,
        contextLocationLookups: {},
        graphData: graphData
      });
      
    }
    

    if(this.props.isWaiting != this.state.isWaiting) {
      this.setState( {isWaiting: this.props.isWaiting});
    }

    if (this.props.locations != this.state.locations) {
      var regionTypes = this.getRegionTypes(this.props.locations);

      var locations_sorted = this.props.locations.sort(function(a, b) {
        if (a.uri < a.uri) return -1;
        if (a.uri > a.uri) return 1;
        return 0;
      });

      this.setState({
        locations: locations_sorted,
        orig_locations: this.props.locations,
        usefilteredLocations: false,
        jobqueue: {},
        regionTypes: regionTypes,
        graphData: graphData
      });         


      /*
      //check if errorMessage
      if(this.props.locations == 'errorMessage') {
        var arrDivs = this.updateArrDivs(this.props.locations);
        this.setState({
          arrDivs: arrDivs
        });
      }
      else if('res' in this.props.locations) {
        var arrDivs = this.updateArrDivs(this.props.locations);
        this.setState({
          arrDivs: arrDivs
        })
      } 
      */   
      if(this.props.locations.length > 0) {
        var arrDivs = this.updateArrDivs(this.props.locations);
        this.setState({
          arrDivs: arrDivs
        });
      }
      
    }    

  }

  getFilteredLocationList() {
    var locations = JSON.parse(JSON.stringify(this.state.orig_locations))
    
    var filterArr = this.state.regionTypeFilter;

    if(locations && locations != 'errorMessage' && 'res' in locations) {
      
      var filteredListOfResults = []
      locations.res.forEach(function(item, index) {
        filterArr.forEach(function(filter, index2) {
          if(item['dataset'].startsWith(filter)) {
            filteredListOfResults.push(item);
          }
        });        
      });
      locations.res = filteredListOfResults;
      locations.count = filteredListOfResults.length;
      
      return locations;
    }

    return []
  }

  getRegionTypes(locations) {
    var regions = {};
    if(locations && locations != 'errorMessage' && 'res' in locations) {
      locations.res.forEach(function(item, index) {
        if (item['dataset'].startsWith("asgs16_")) {          
            regions['asgs16'] =  "ASGS 2016";
        }
        else if(item['dataset'].startsWith("geofabric2_1_1_")) {
            regions['geofabric2_1_1'] =  "Geofabric v2.1.1";
        }
      });
    }
    if(regions == {} || regions === 'undefined') {
      return [];
    }
  
    var arr = []
    Object.keys(regions).forEach(function(key) {
      arr.push({'id': key, 'label': regions[key] });
    });
  
    return arr;
  }

  updateWithins(withins_locations) {
    console.log(withins_locations)

  }

  updateLocations() {
    console.log("updateLocations")
    this.setState({
      locations: this.props.locations
    })
  }

  convertTreeObjToD3Data(parent, node, graphData, idx = {}) {
    var curr = {
      'name': node['name'],
      'label': node['label']
    };

    //Add to node list only if not seen before
    if (!(curr['name'] in idx)) {
      graphData['nodes'].push(curr)
      idx[curr['name']] = 1
    }

    node['children'].forEach(item => {
      console.log(item)

      graphData['links'].push({
        "source": node['name'],
        "target": item['name']
      });

      this.convertTreeObjToD3Data(curr, item, graphData, idx)
    });

    return graphData;
  }

  callbackFunction = (uri, relation, data, jobid) => {
    console.log(uri);
    console.log(relation);
    console.log(data);

    var curr = this.state.contextLocationLookups;

    if (!(uri in curr)) {
      curr[uri] = {};
    }
    if (!(relation in curr[uri])) {
      curr[uri][relation] = {};
    }
    curr[uri][relation] = data;

    this.removeJobFromQueue(jobid);
    this.setState({
      contextLocationLookups: curr
    })
  }

  errorCallback = (errMessage, jobid) => {
    console.log(errMessage);
    this.removeJobFromQueue(jobid);
  }

  downloadFeatureGeom = (item, view) => {
    console.log("downloadFeatureGeom..."); 
    console.log(item); 
    console.log(view); 
  }

  handleSelect(eventKey, event) {
    console.log(eventKey); 
    console.log(event); 
  }

  testclick(eventKey, event) {
    console.log("testclick"); 
    console.log(eventKey); 
    console.log(event); 
  }
  testSelect(eventKey, event) {
    console.log("testSelect"); 
    console.log(eventKey); 
    console.log(JSON.parse(eventKey))
    console.log(event); 
  }

  downloadResource(file, text) { 
              
    //creating an invisible element 
    var element = document.createElement('a'); 
    element.setAttribute('href',  
    'data:text/plain;charset=utf-8, ' 
    + encodeURIComponent(text)); 
    element.setAttribute('download', file); 
  
    // Above code is equivalent to 
    // <a href="path of file" download="file name"> 
  
    document.body.appendChild(element); 
  
    //onClick property 
    element.click(); 
  
    document.body.removeChild(element); 
} 
  
doFindTemporalIntersection = (item, view) => {
  console.log("doFindTemporalIntersection..."); 
  console.log(item); 
  console.log(view); 
}

doViewFeature = (item, view) => {
  console.log("doViewFeature..."); 
  console.log(item); 
  console.log(view); 
}


handleSelectViewFeature(eventKey, event) {
  console.log(eventKey); 
  console.log(event); 
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

  updateArrDivs = (locations) => {
    var arrDivs = [];
    var here = this;
    //change this to iterate through a list rather than a location dict obj
    
    if(locations) {
      //this.state.locations['res'].forEach(function(item, index) {
      //  console.log(item);
      //});
      
      locations.forEach(function(item, index) {
        
        arrDivs.push( (
          <div className="mainPageResultListItem" key={index}>
            <div>
                Feature: <a target="feature" href={item['uri']}>{item['uri']}</a> <span>&nbsp;</span> <br/>
                <div className="feature-res-btn-list">
                <ButtonToolbar>

                  <DropdownButton id="dropdown-basic-button" 
                        size="sm" variant="outline-primary" title="View feature">                    
                    <Dropdown.Item eventKey="viewFeatureGetPointInTime" onClick={(e) => here.viewFeatureGetPointInTimeCallback(e, item['uri'])}>Find at a point in time</Dropdown.Item>
                  </DropdownButton>  
                  <DropdownButton   id="dropdown-basic-button2" 
                        size="sm" variant="outline-primary" title="Find by spatial operation">
                    <Dropdown.Item eventKey="1" onClick={(e) => here.findTemporalOperationSingleTimePointCallback(e, item['uri'], 'intersects')}>Intersect at single time point</Dropdown.Item>                    
                    <Dropdown.Item eventKey="1" onClick={(e) => here.findTemporalOperationSingleTimePointCallback(e, item['uri'], 'contains')}>Contains at single time point</Dropdown.Item>                    
                    <Dropdown.Item eventKey="1" onClick={(e) => here.findTemporalOperationSingleTimePointCallback(e, item['uri'], 'within')}>Within at single time point</Dropdown.Item>                    
                  </DropdownButton>  
                </ButtonToolbar>
                </div>
                
            </div>
          </div>
        ));
              /* <Dropdown.Item eventKey="2" onClick={(e) => here.findTemporalIntersectionDiffTimePointCallback(e, item['uri'])}>Different time points</Dropdown.Item>
                              <Dropdown.Item eventKey="3" onClick={(e) => here.findTemporalIntersectionTimeSpanPointCallback(e, item['uri'])}>Time span</Dropdown.Item>*/

      });      
    }
    else {
      arrDivs.push( (
        <div className="mainPageResultError">Error: Find By Location API encountered an unexpected error. Please try again later.</div>));
      here.setState({
          findByLocationError: true
      });
    }
    this.setState({
      showCurrentResults: true
    });
    return arrDivs;
  }


  handleViewGeomClick(e, geom_uri) {
    console.log('this is:', e);
    console.log('geometry uri:', geom_uri);
    //this.setState({
    //  currGeom: geom_uri
    //});

    //lookup geom and call update leaflet function with uri
    
    var geom_svc_headers = new Headers();
    geom_svc_headers.append('Accept', 'application/json');
    var here = this;
    if(geom_uri.indexOf("?") > -1) {
      geom_uri = geom_uri + "&_view=simplifiedgeom"
    }
    else {
      geom_uri = geom_uri + "?_view=simplifiedgeom"
    }
    fetch(geom_uri, {       
      headers: geom_svc_headers })
        .then(response => {
          console.log(response);
          return response.json()
        })
        .then(data => {
          console.log(data);
          here.props.renderSelectedGeometryFn(data);
        }
        )
        .catch(error => 
          { 
            //this.setState({ error, isLoading: false });
            console.log("Error getting ", geom_uri);
            console.log(error)
          }
          );
          
    

  }


  render() {
    const labelMapping = {
      "mb": "ASGS MeshBlock",
      "cc": "Geofabric ContractedCatchment"
    }
    var here = this;

    var fn = this.renderWithins;
    var contextLocationLookups = this.state.contextLocationLookups;
    console.log(contextLocationLookups);
    var message = (<div></div>)
    if (this.state.locations && Object.keys(this.state.locations).length > 0) {
      message = (<div><h3>Results</h3></div>)
    }

    console.log(this.state.locations);
    var pointMessage = (<p></p>)
    if (this.state.latlng) {
      pointMessage = (<p>Point selected on map: {this.state.latlng}</p>)
    }

    var arrDivs = this.state.arrDivs;
  
     var validArrDivsOrBlank = (arrDivs.length > 0) ?
      (
        <div>
            {arrDivs}
            </div>        
      )
      :
      <div></div>;
    console.log(this.state.jobqueue);

    if(this.state.isWaiting) {
      validArrDivsOrBlank = (<div><img src="/spinner.gif"/></div>)
    }

    if(this.state.showTemporalAPIForm) {
      if(this.state.mode == 'VIEW_FEATURE_GET_POINT_IN_TIME') {
        return (<ViewFeaturePointInTime showCurrentResults={this.showCurrentResults} 
          renderSelectedGeometryFn={here.props.renderSelectedGeometryFn} 
          renderComparisonGeometryFn={here.props.renderComparisonGeometryFn}            
          featureURI={this.state.currentTemporalFeatureURI}          
          />)  
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
    return (
      <div className="h-100" >
        <Row>
          <Col sm={12} className="fullheight-results">


            {message}

            {pointMessage}

            {validArrDivsOrBlank}

            




          </Col>
        </Row>
      </div>
    )
  }
}