// @flow

import React, { createRef, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

export default class FindByPointContainsResults extends Component {
  constructor(props) {
    super(props)
    this.state = {
      contains: [],
      num_contains: 0,
      locationUri: this.props.locationUri
    }
  }

  componentDidMount() {
    this.setState({ 
      isLoading: true,
      locationUri: this.props.locationUri
    });

    console.log(this.props.locationUri)
    
    this.findcontains(this.props.locationUri);
  }

  componentDidUpdate() {
    if (this.state.isLoading != true && this.props.locationUri != this.state.locationUri) {
      this.setState({
        isLoading: true,
        locationUri: this.props.locationUri
      });

      console.log(this.props.locationUri)

      this.findcontains(this.props.locationUri);
    }
  }

  getcontains(contains_locations) {
    console.log(contains_locations);
    if (contains_locations && 'locations' in contains_locations) {
      return contains_locations.locations;
    }

  }

  getcount(contains_locations) {
    if (contains_locations && 'meta' in contains_locations) {
      return contains_locations.meta.count;
    }
    return -1;
  }


  findcontains(uri) {
    //https://api2.loci.cat/api/v1/location/contains?uri=http%3A%2F%2Flinked.data.gov.au%2Fdataset%2Fasgs2016%2Fmeshblock%2F30563383400
    //    &areas=true&proportion=true&contains=false&within=false&count=1000&offset=0


    var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
      + "/location/contains"),
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
            contains: this.getcontains(result),
            num_contains: this.getcount(result),
            isLoading: false
          });
          console.log(result);
          this.props.parentCallback(uri, "contain", result);

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

  rendercontains(containsObj) {
    console.log("rendercontains")
    console.log(containsObj)

    var count = 0;
    if (containsObj) {
      return (<ul> {
        containsObj.map((item, index) => (
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
      return (<div><span>contains:</span><p>Loading ...</p></div>);
    }
    return (
      <div><span>Contains ({this.state.num_contains} locations):</span>{this.rendercontains(this.state.contains)}</div>
    );
  }
}