// @flow

import React, { createRef, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

export default class FindByPointResults extends Component {
  formatList(l) {
    l.forEach(item =>  console.log(item))
    //return <ul>
    //  { l.forEach(item => <li>{item}</li>) }
    //</ul> 
  }
  formatResults(locations) {
    var rows = [];

    rows = Object.keys(locations).map((key, index) => ( 
      <div>
      <p key={index}> {key} </p>
         
      </div>
    ));

    console.log(rows);
    const res=  <div> {rows.forEach(item => <div>{item}</div> )} </div>
    return res;
;
  }
  render() {
    console.log(this.props.locations);
    const labelMapping = {
      "mb" : "ASGS MeshBlock",
      "cc" : "Geofabric ContractedCatchment"
    }
    return (
      <Container>
      <Row>
        <Col>
          <h3>Results</h3>

          <p>{this.props.latlng}</p>
          {
            Object.keys(this.props.locations).map((key, index) => ( 
              <div key={index}>
                <p > {labelMapping[key]} </p> 
                <ul>
                {this.props.locations[key].map(function(uri, index){
                    return <li key={ index }><a href={uri}>{uri}</a></li>;
                  })}
                </ul>     
              </div>
            ))
          }      
        </Col>        
      </Row>
    </Container>
    )
  }
}