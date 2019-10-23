// @flow

import React, { createRef, useState, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import SimpleLeaflet from "./SimpleLeaflet"
import FindByPointResults from "./FindByPointResults"


export default class FindByPointComponent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      latlng: null,
      locations: {},
      num_locations: 0
    }
    this.updateResult = this.updateResult.bind(this);


    this.testFn = (latlng) => {
      console.log("TestFN here! " + latlng);
      this.updateResult(latlng)      
    };
  }
  renderlatlng(latlng) {
    return latlng.lat + ", " + latlng.lng;
  }

  updateResult(latlng) {
    // Explicitly focus the text input using the raw DOM API
    // Note: we're accessing "current" to get the DOM node
    this.setState({
      latlng: latlng
    });
    console.log("State updated!")
    console.log(this.state)
    this.findByLatLng();

  }
  arrayAwareInvert(obj) {
    var res = {};
    for (var p in obj) {
        var arr = obj[p], l = arr.length;
        for (var i=0; i<l; i++) {
            res[arr[i]] = p;
        }
    }
    return res;
  }

  formatResults(r) {
    console.log(r);

    const listLocations = this.arrayAwareInvert(r.locations); 
    console.log(listLocations);

    this.setState({
       num_locations: r.meta.count,
       locations: r.locations
    })
    return r;
  }

  findByLatLng() {
    //       https://api2.loci.cat/api/v1/location/find_at_location?loci_type=any&lat=-29.901619&lon=141.391879&count=1000&offset=0
      console.log("find_at_location");

      var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT 
                        + "/location/find_at_location"),
          params = {
                      loci_type: "any",
                      lat: this.state.latlng.lat, 
                      lon: this.state.latlng.lng,
                      count: 1000,
                      offset: 0
                    }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      console.log(url);
      fetch(url)
          .then(res => res.json())
          .then(
            (result) => {
              this.setState({
                queryResults: this.formatResults(result)
              });
              console.log(result);
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
              this.setState({              
                error
              });
            }
          )
  }
  render() {
    var ll = null;
    var numLoc = 0;
    var locations = {};
    
    if (this.state.latlng) {
       ll = this.state.latlng.lat.toString() + ", " + this.state.latlng.lng.toString() ;
       locations = this.state.locations;
       numLoc = this.state.num_locations;

    }
    return (
      <Container fluid='true'>
        <Row>
          <Col sm={8}>
            <SimpleLeaflet inputRef={this.testFn} />
          </Col>
          <Col sm={4}>
            <FindByPointResults latlng={ll} locations={locations} count={numLoc}/>
          </Col>
        </Row>
      </Container>
    )
  }
}