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
      graphData: {}
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

    Object.keys(this.props.locations).map((loc_type_key, index) => {
      var c = {
        'name': loc_type_key,
        'label': labelMapping[loc_type_key],
        'children': []
      };

      //iterate through uris
      Object.keys(contextLocationLookups).map((uri, index) => {
        if (
          (loc_type_key == 'cc' && uri.includes("contractedcatchment"))
          ||
          (loc_type_key == 'mb' && uri.includes("meshblock"))
        ) {
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

          if ('within' in contextLocationLookups[uri]) {
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
          if ('overlap' in contextLocationLookups[uri]) {
            contextLocationLookups[uri]['overlap'].overlaps.forEach(item => {
              overlapChild.children.push({
                'name': item.uri,
                'label': item.uri,
                'children': []
              });
            });
          }

          node.children.push(withinChild)
          node.children.push(overlapChild)

          c['children'].push(node);
        }

      })


      rootObj['children'].push(c);
    });
    console.log(rootObj);
    graphData = this.convertTreeObjToD3Data(null, rootObj, graphData, {});
    console.log(graphData);

    var here = this;
    var arrDivs = Object.keys(this.props.locations).map((key, index) => (
      <div key={index}>
        <p > {labelMapping[key]} </p>
        <ul>
          {
            this.props.locations[key].map(function (uri, index) {
              return (
                <li key={index}>
                  <a href={uri}>{uri}</a>
                  <FindByPointWithinsResults locationUri={uri} parentCallback={here.callbackFunction} />
                  <FindByPointOverlapResults locationUri={uri} parentCallback={here.callbackFunction} />
                </li>
              );
            })
          }
        </ul>
      </div>
    ));

    var validArrDivsOrBlank = (arrDivs.length > 0) ?
      (
        <div>
            <div><FindByPointGraphVisualiser graphData={graphData} /></div>
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