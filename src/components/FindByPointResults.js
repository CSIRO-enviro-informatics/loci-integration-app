// @flow

import React, { createRef, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import FindByPointWithinsResults from './FindByPointWithinsResults'

export default class FindByPointResults extends Component {
  constructor(props) {
    super(props)

    this.state = {
      locations: this.props.locations,
      withins_lookup: {},
      isLoading: false
    }
    this.updateWithins = this.updateWithins.bind(this);
    this.updateLocations = this.updateLocations.bind(this);
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


  render() {
    const labelMapping = {
      "mb": "ASGS MeshBlock",
      "cc": "Geofabric ContractedCatchment"
    }

    var fn = this.renderWithins;

    
    return (
      <Container>
        <Row>
          <Col sm={12}>
            <h3>Results</h3>

            <p>{this.props.latlng}</p>
            {
              Object.keys(this.props.locations).map((key, index) => (
                <div key={index}>
                  <p > {labelMapping[key]} </p>
                  <ul>
                    {
                      this.props.locations[key].map(function (uri, index) {
                        return (
                          <li key={index}>
                            <a href={uri}>{uri}</a>
                            <FindByPointWithinsResults locationUri={uri} />
                          </li>
                        );
                      })
                    }
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