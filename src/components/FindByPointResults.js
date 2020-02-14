// @flow

import React, { createRef, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import FindByPointWithinsResults from './FindByPointWithinsResults'
import FindByPointOverlapResults from './FindByPointOverlapResults'
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import FindByPointGraphVisualiser from './FindByPointGraphVisualiser';
import Button from "react-bootstrap/Button";


export default class FindByPointResults extends Component {
  constructor(props) {
    super(props)
    var graphData = { "nodes": [], "links": [] };

    this.state = {
      locations: this.props.locations,
      withins_lookup: {},
      isLoading: false,
      latlng: this.props.latlng,
      contextLocationLookups: {},
      graphData: graphData,
      currGeom: undefined,
      jobqueue: {},
      isGraphLoading: false,
      arrDivs: []
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
        jobqueue: {},
        graphData: graphData
      });
      
    }

    if (this.props.locations != this.state.locations) {
      
      this.setState({
        locations: this.props.locations,
        jobqueue: {},
        graphData: graphData
      });         
      if('res' in this.props.locations) {
        var arrDivs = this.updateArrDivs(this.props.locations);
        this.setState({
          arrDivs: arrDivs
        })
      }    
      
    }    
    if(this.state.isGraphLoading == true && Object.keys(this.state.jobqueue).length == 0){
      this.updateGraphData();
      this.setState({
        isGraphLoading: false
      })
    } 
    console.log(this.state.jobqueue);
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

  updateArrDivs = (locations) => {
    var arrDivs = [];
    var here = this;
    //change this to iterate through a list rather than a location dict obj
    
    if(locations && locations != 'errorMessage' && 'res' in locations) {
      //this.state.locations['res'].forEach(function(item, index) {
      //  console.log(item);
      //});
      
      var resultsDiv = locations.res.forEach(function(item, index) {
        var withinJobId = index + "-within";
        here.addJobToQueue(withinJobId, {});
        var overlapJobId = index + "-overlap";
        here.addJobToQueue(overlapJobId, {});
        here.state.isGraphLoading = true;

        arrDivs.push( (
          <div class="mainPageResultListItem" key={index}>
            <div>
                Feature: <a href={item['feature']}>{item['feature']}</a> 
                <Button variant="outline-primary" size="sm" onClick={(e) => here.handleViewGeomClick(e, item['geometry'])}>
                  View Geometry
                </Button>
                <br/>Dataset: {item['dataset']}
                      <FindByPointWithinsResults locationUri={item['feature']} jobid={withinJobId}  errorCallback={here.errorCallback} parentCallback={here.callbackFunction} />
                      <FindByPointOverlapResults locationUri={item['feature']} jobid={overlapJobId}  errorCallback={here.errorCallback} parentCallback={here.callbackFunction} />
                
            </div>
          </div>
        ));
      });        
    }
    return arrDivs;
  }


  addJobToQueue = (key, j) => {    
    if(key in this.state.jobqueue) {
      //exists in queue!
      return
    }
    else {
      var newqueue = this.state.jobqueue;
      newqueue[key] = j;
      this.setState({
        jobqueue: newqueue
      })
      console.log("added " + key + " from queue");
    }     
  }
  removeJobFromQueue = (key) => {    
    console.log("removing " + key + " from queue");

    if(key in this.state.jobqueue) {
      delete this.state.jobqueue[key];
      console.log("removed " + key + " from queue");
      console.log()
    }
  }


  updateGraphData = () => {
    //this.setState({
    //  graphData: g
    //});

    var graphData = { "nodes": [], "links": [] };

    var rootObj = {
      'name': 'root',
      'label': 'root',
      'class': "root",
      'fixed': true,
      'children': []
    };
    

    if(this.state.locations != 'errorMessage' && 'res' in this.state.locations) {
      this.state.locations.res.forEach(
        (resItem, index) => {
        var dataset_label = resItem['dataset'];
        var uri = resItem['feature'];
        var c = {
          'name': dataset_label,
          'label': dataset_label,
          'children': []
        };
  
        
          var node = {
            'name': uri,
            'label': uri,
            'children': []
          };
          var withinChild = {
            'name': uri + "-within",
            'label': "within",
            'children': []
          };
  
          if (uri in this.state.contextLocationLookups && 'within' in this.state.contextLocationLookups[uri]) {
            this.state.contextLocationLookups[uri]['within'].locations.forEach(item => {
              withinChild.children.push({
                'name': item,
                'label': item,
                'children': []
              });
            });
          }
  
          var overlapChild = {
            'name': uri + "-overlap",
            'label': "overlap",
            'children': []
          };
          if (uri in this.state.contextLocationLookups && 'overlap' in this.state.contextLocationLookups[uri]) {
            this.state.contextLocationLookups[uri]['overlap'].overlaps.forEach(item => {
              overlapChild.children.push({
                'name': item.uri,
                'label': item.uri,
                'children': []
              });
            });
          }
  
          if(withinChild['children'].length > 0) {
            node.children.push(withinChild);
          }          
          if(overlapChild['children'].length > 0) {
            node.children.push(overlapChild);
          }
  
          c['children'].push(node);
        
          
  
        rootObj['children'].push(c);
      });
  
    }
    console.log(this.state.jobqueue);
    console.log(rootObj);
    graphData = this.convertTreeObjToD3Data(null, rootObj, graphData, {});
    console.log(graphData);

    if(graphData != this.state.graphData) {
      this.setState({
        graphData: graphData
      });  
    }

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
    if('?' in geom_uri) {
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

    var fn = this.renderWithins;
    var contextLocationLookups = this.state.contextLocationLookups;
    console.log(contextLocationLookups);
    var message = (<div></div>)
    if (this.state.locations && Object.keys(this.state.locations).length > 0) {
      message = (<div><h3>Results</h3></div>)
    }

    var pointMessage = (<p></p>)
    if (this.state.latlng) {
      pointMessage = (<p>Point selected on map: {this.state.latlng}</p>)
    }

    var gd = this.state.graphData;
    console.log(gd);


    var arrDivs = this.state.arrDivs;
  
    
    var validArrDivsOrBlank = (arrDivs.length > 0) ?
      (
        <div>
            <div><FindByPointGraphVisualiser graphData={this.state.graphData} callback={this.props.renderResultSummaryFn}/></div> 
            {arrDivs}
            </div>        
      )
      :
      <div></div>;

    console.log(this.state.jobqueue);

    return (
      <Container>
        <Row>
          <Col sm={12}>


            {message}

            {pointMessage}

            {validArrDivsOrBlank}






          </Col>
        </Row>
      </Container>
    )
  }
}