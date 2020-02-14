// @flow

import React, { createRef, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

export default class FindByPointOverlapResults extends Component {
  constructor(props) {
    super(props)
    this.state = {
      overlaps: [],
      num_overlaps: 0,
      locationUri: this.props.locationUri
    }
  }

  componentDidMount() {
    this.setState({ 
      isLoading: true,
      locationUri: this.props.locationUri
    });

    console.log(this.props.locationUri)
    
    this.findoverlaps(this.props.locationUri);
  }

  componentDidUpdate() {
    if (this.state.isLoading != true && this.props.locationUri != this.state.locationUri) {
      this.setState({
        isLoading: true,
        locationUri: this.props.locationUri
      });

      console.log(this.props.locationUri)

      this.findoverlaps(this.props.locationUri);
    }
  }

  getoverlaps(overlaps_locations) {
    console.log(overlaps_locations);
    if (overlaps_locations && 'overlaps' in overlaps_locations) {
      return overlaps_locations.overlaps;
    }

  }

  getcount(overlaps_locations) {
    if (overlaps_locations && 'meta' in overlaps_locations) {
      return overlaps_locations.meta.count;
    }
    return -1;
  }


  findoverlaps(uri) {
    //https://api2.loci.cat/api/v1/location/overlaps?uri=http%3A%2F%2Flinked.data.gov.au%2Fdataset%2Fasgs2016%2Fmeshblock%2F30563383400
    //    &areas=true&proportion=true&contains=false&within=false&count=1000&offset=0

    console.log("within");

    var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
      + "/location/overlaps"),
      params = {
        uri: uri,
        areas: true,
        proportion: true,
        contains: false,
        within: false,        
        count: 1000,
        offset: 0
      }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    console.log(url);
    var here = this;
    var errCallback = this.props.errorCallback;
    fetch(url)
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            overlaps: this.getoverlaps(result),
            num_overlaps: this.getcount(result),
            isLoading: false
          });
          console.log(result);
          this.props.parentCallback(uri, "overlap", result, this.props.jobid);

        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.props.errorCallback(error, this.props.jobid);
          this.setState({
            error
          });
        }
      )
      .catch(e => {
        console.log("caught err: " + this.props.jobid);
        if ('errorCallback' in this.props) {
          this.props.errorCallback(e, this.props.jobid);
        }
      })
      .finally( () => {
        console.log("finally: " + this.props.jobid);
        if (typeof this.props.errorCallback === "function") {
          this.props.errorCallback("", this.props.jobid);
        }
        else {
          console.log (typeof this.props.errorCallback);
        }
      });
  }

  renderoverlaps(overlapsObj) {
    //console.log("renderoverlaps")
    //console.log(overlapsObj)

    if (overlapsObj) {
      return (<ul> {
        overlapsObj.map((item, index) => (
          <li className="indent" key={index}>
            <a href={item.uri}>{item.uri}</a>
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
      return (<div><span>overlaps:</span><p>Loading ...</p></div>);
    }
    return (
      <div><span>Overlapping with ({this.state.num_overlaps} locations):</span>{this.renderoverlaps(this.state.overlaps)}</div>
    );
  }
}