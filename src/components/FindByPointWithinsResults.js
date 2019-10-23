// @flow

import React, { createRef, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

export default class FindByPointWithinsResults extends Component {
  constructor(props) {
    super(props)
    this.state = {
      withins: [],
      locationUri: this.props.locationUri
    }
  }

  componentDidMount() {
    this.setState({ 
      isLoading: true,
      locationUri: this.props.locationUri
    });

    console.log(this.props.locationUri)
    
    this.findWithins(this.props.locationUri);
  }

  componentDidUpdate() {
    if (this.state.isLoading != true && this.props.locationUri != this.state.locationUri) {
      this.setState({
        isLoading: true,
        locationUri: this.props.locationUri
      });

      console.log(this.props.locationUri)

      this.findWithins(this.props.locationUri);
    }
  }

  formatWithins(withins_locations) {
    console.log(withins_locations);
    if (withins_locations && 'locations' in withins_locations) {
      return withins_locations.locations;
    }
    return [];
  }

  findWithins(uri) {
    //https://api2.loci.cat/api/v1/location/within?uri=http%3A%2F%2Flinked.data.gov.au%2Fdataset%2Fasgs2016%2Fmeshblock%2F30563394200&count=1000&offset=0
    console.log("within");

    var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
      + "/location/within"),
      params = {
        uri: uri,
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
            withins: this.formatWithins(result),
            isLoading: false
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

  renderWithins(withinsObj) {
    console.log("renderWithins")
    console.log(withinsObj)

    if (withinsObj) {
      return (<ul> {
        withinsObj.map((item, index) => (
          <li className="indent" key={index}>
            <a href={item}>{item}</a>
          </li>
        ))
      }
      </ul>)
    }
    return <p></p>
  }

  render() {
    const isLoading  = this.state.isLoading;
    if (isLoading) {
      return (<div><span>Withins:</span><p>Loading ...</p></div>);
    }
    return (
      <div><span>Withins:</span>{this.renderWithins(this.state.withins)}</div>
    );
  }
}