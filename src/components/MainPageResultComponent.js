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

export default class MainPageResultComponent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      contextLocationLookups: {},
      location_uri: this.props.location_uri
    }

  }

  componentDidMount() {
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
      console.log("fetch: " + data);
    });

    this.setState({
      contextLocationLookups: curr
    })
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