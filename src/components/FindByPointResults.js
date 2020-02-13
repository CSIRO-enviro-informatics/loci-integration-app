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

export default class FindByPointResults extends Component {
  constructor(props) {
    super(props)

    this.state = {
      locations: this.props.locations,
      withins_lookup: {},
      isLoading: false,
      latlng: this.props.latlng,
      contextLocationLookups: {},
      graphData: {},
      currGeom: undefined
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
    if (this.props.latlng != this.state.latlng) {
      this.setState({
        latlng: this.props.latlng,
        contextLocationLookups: {}
      });
    }
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

  callbackFunction = (uri, relation, data) => {
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


    this.setState({
      contextLocationLookups: curr
    })
  }

  updateGraphData = (g) => {
    this.setState({
      graphData: g
    });
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
    if (this.props.locations && Object.keys(this.props.locations).length > 0) {
      message = (<div><h3>Results</h3></div>)
    }

    var pointMessage = (<p></p>)
    if (this.props.latlng) {
      pointMessage = (<p>Point selected on map: {this.props.latlng}</p>)
    }

    var graphData = { "nodes": [], "links": [] };

    var rootObj = {
      'name': 'root',
      'label': 'root',
      'class': "root",
      'fixed': true,
      'children': []
    };

    if(this.props.locations != 'errorMessage' && 'res' in this.props.locations) {
      this.props.locations.res.forEach(
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
  
          if (uri in contextLocationLookups && 'within' in contextLocationLookups[uri]) {
            contextLocationLookups[uri]['within'].locations.forEach(item => {
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
          if (uri in contextLocationLookups && 'overlap' in contextLocationLookups[uri]) {
            contextLocationLookups[uri]['overlap'].overlaps.forEach(item => {
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

    console.log(rootObj);
    graphData = this.convertTreeObjToD3Data(null, rootObj, graphData, {});
    console.log(graphData);

    var here = this;
    //change this to iterate through a list rather than a location dict obj
    var arrDivs = [];
    if(this.props.locations != 'errorMessage' && 'res' in this.props.locations) {
      this.props.locations['res'].forEach(function(item, index) {
        console.log(item);
      });
      var resultsDiv = this.props.locations.res.forEach(function(item, index) {
        arrDivs.push( (
          <div class="mainPageResultListItem" key={index}>
            <div>
                Feature: <a href={item['feature']}>{item['feature']}</a> 
                <button onClick={(e) => here.handleViewGeomClick(e, item['geometry'])}>
                  View Geometry
                </button>
                <br/>Dataset: {item['dataset']}
                      <FindByPointWithinsResults locationUri={item['feature']} parentCallback={here.callbackFunction} />
                      <FindByPointOverlapResults locationUri={item['feature']} parentCallback={here.callbackFunction} />
                
            </div>
          </div>
        ));
      });        
    }

  
    var validArrDivsOrBlank = (arrDivs.length > 0) ?
      (
        <div>
            <div><FindByPointGraphVisualiser graphData={graphData} callback={this.props.renderResultSummaryFn}/></div> 
            {arrDivs}
            </div>        
      )
      :
      <div></div>;



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