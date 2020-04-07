// @flow

import React, { createRef, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import FindByPointWithinsResults from './FindByPointWithinsResults'
import FindByPointOverlapResults from './FindByPointOverlapResults'
import FindByPointContainsResults from './FindByPointContainsResults'
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import FindByPointGraphVisualiser from './FindByPointGraphVisualiser';
import proj from 'proj4';


export default class MainPageResultComponent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      contextLocationLookups: {},
      location_uri: this.props.location_uri,
      locationResourceData: {}
    }

  }

  componentDidMount() {
    fetch(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT + "/resource?uri=" + this.props.location_uri)
        .then(res => res.json())
        .then(
          (result) => {
            this.setState({
              isLoaded: true,
              locationResourceData: result
            });
            this.loadGeom(result)
          },
          // Note: it's important to handle errors here
          // instead of a catch() block so that we don't swallow
          // exceptions from actual bugs in components.
          (error) => {
            this.setState({
              isLoaded: true,
              error
            });
          }
        );
    this.setState({
      contextLocationLookups: {},
      location_uri: this.props.location_uri
    });
  }

  componentDidUpdate() {
    if(this.props.location_uri != this.state.location_uri) {
      this.setState( {
        location_uri: this.props.location_uri
      })
    }
    
  }

  convertTreeObjToD3Data(parent, node, graphData, idx = {}) {
    var curr = {
      'name': node['name'],
      'label': node['label']
    };

    if('class' in node) {
      curr['class'] = node['class']
    }

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
  getGeomInfo = (uri) => {
      fetch(uri, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
       .then(response => response.json())
       .then(data => {
         console.log(data)
       });
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

    //fetch the geometry info
    fetch(uri, {
      method: "GET",
      //mode: "no-cors",
      headers: {
        "Accept": "application/ld+json"
      }
    }).then(function(response) {
      //response.status     //=> number 100–599
      //response.statusText //=> String
      //response.headers    //=> Headers
      //response.url        //=> String
      console.log("fetch status: " + response.status);
      console.log("fetch: " + response.text());
      return response.json();
    }, function(error) {
      //error.message //=> String
      console.log("fetch error: " + error);
    })
    .then(function(data) {
      // Do stuff with the JSON
      //console.log("fetch: " + data);
    });

    this.setState({
      contextLocationLookups: curr
    })
  }

 

  loadGeom(location_resource) {

    var geom_uri = "";
    if("http://www.opengis.net/ont/geosparql#hasDefaultGeometry" in location_resource) {
       geom_uri = location_resource["http://www.opengis.net/ont/geosparql#hasDefaultGeometry"]
    }
    else if ("http://www.opengis.net/ont/geosparql#hasGeometry" in location_resource) {
       geom_uri = location_resource["http://www.opengis.net/ont/geosparql#hasGeometry"]
    }

    if(geom_uri == "") {
      return;
    }
    console.log('geometry uri:', geom_uri);
    //this.setState({
    //  currGeom: geom_uri
    //});

    if (typeof geom_uri === 'string' || geom_uri instanceof String) {
      geom_uri = geom_uri.replace("http:", "https:");
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
    else {
      //handle geom object
      let geom_obj = geom_uri;
      var wkt = '';
      if("http://www.opengis.net/ont/geosparql#asWKT" in geom_obj) {
        wkt = geom_obj["http://www.opengis.net/ont/geosparql#asWKT"];
        var geojson = this.transformPointCrs(wkt);
        this.props.renderSelectedGeometryFn(geojson);
      }
    }
  }

  transformPointCrs(coord_str) {
    proj.defs("EPSG:4283","+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
    var dest_crs = new proj.Proj("EPSG:4326");    //source coordinates will be in Longitude/Latitude
    var source_crs = new proj.Proj("EPSG:4283");

    var cstr = "<http://www.opengis.net/def/crs/EPSG/0/4283> POINT(149.12153731 -35.28388695)";
    let regexp = /<http:\/\/www.opengis.net\/def\/crs\/EPSG\/0\/(4283)> POINT\((149.12153731) (-35.28388695)\)/;

    let result = cstr.match(regexp);
    console.log(result)

    let epsgCode = result[1];
    let coord1 = Number(result[2]);
    let coord2 = Number(result[3]);
    var p = [coord1, coord2];   //any object will do as long as it has 'x' and 'y' properties
    proj.transform(source_crs, dest_crs, p);      //do the transformation.  x and y are modified in place

    console.log(p);

    var geojson = {
      "type": "Feature",
      "geometry": {
          "type": "Point",
          "coordinates": p
      }
    };

    console.log(geojson);
    return geojson;

  }

  render() {

    var uri = this.state.location_uri
    var contextLocationLookups = this.state.contextLocationLookups;

    var graphData = { "nodes": [], "links": [] };

    var rootObj = {
      'class': "root",
      'fixed': true,
      'children': [],
      'name': uri,
      'label': uri,
      'children': []
    };


    var node = rootObj;

    var childCount = 0;

    var withinChild = {
      'name': uri + "-within",
      'label': "within",
      'class' : "within",
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

    childCount = 0;
    var containChild = {
      'name': uri + "-contain",
      'label': "contain",
      'class' : "contain",
      'children': []
    };
    if (uri in contextLocationLookups && 'contain' in contextLocationLookups[uri]) {
      contextLocationLookups[uri]['contain'].locations.forEach(item => {
        
        if(childCount <= 25) {
          containChild.children.push({
            'name': item,
            'label': item,
            'children': []
          });
        }
        else {
          containChild['label'] = "contain (showing sample of 25 features)"
        }
        childCount = childCount + 1;
      });
    }

    childCount = 0;
    var overlapChild = {
      'name': uri + "-overlap",
      'label': "overlap",
      'class' : "overlap",
      'children': []
    };
    if (uri in contextLocationLookups && 'overlap' in contextLocationLookups[uri] && 'overlaps' in contextLocationLookups[uri]['overlap']) {
      contextLocationLookups[uri]['overlap'].overlaps.forEach(item => {
        overlapChild.children.push({
          'name': item.uri,
          'label': item.uri,
          'children': []
        });
      });
    }

    node.children.push(withinChild)
    node.children.push(containChild)
    node.children.push(overlapChild)    

    console.log(rootObj);
    graphData = this.convertTreeObjToD3Data(null, rootObj, graphData, {});
    console.log(graphData);

    var here = this;
    var divMain = (
      <div>
            <div><FindByPointGraphVisualiser graphData={graphData} callback={this.props.renderResultSummaryFn} /></div>
            <ul>
                <li>
                  <FindByPointWithinsResults locationUri={uri} parentCallback={here.callbackFunction} />
                  <FindByPointOverlapResults locationUri={uri} parentCallback={here.callbackFunction} />
                  <FindByPointContainsResults locationUri={uri} parentCallback={here.callbackFunction} />
                </li>
          </ul>
      </div>
    );

    return (
      <Container>
        <Row>
          <Col sm={12}>
            <div class="summaryResultTitle"> Showing summary for Loc-I feature: <a href={uri}>{uri}</a> 
            </div>

            {divMain}


          </Col>
        </Row>
      </Container >
    )
  }
}