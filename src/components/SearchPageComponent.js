// @flow

import React, { createRef, useState, Component } from 'react'
import {    
  Link    
} from "react-router-dom";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default class SearchPageComponent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      query: null,
      queryResults: null,
      queryTimeElapsed: null
    }
    //this.updateResult = this.updateResult.bind(this);
    this.queryString = React.createRef();

    //this.input = React.createRef();
    this.updateQuery = this.updateQuery.bind(this);
    this.handleChange = this.handleChange.bind(this);


    this.testFn = (q) => {
      console.log("TestFN here! " + q);
    };
  }

  updateQuery() {
    console.log(this.props)
    console.log(this.refs)
    console.log(this.queryString.value)    
  }

  
  handleChange(e) {
    console.log(e)
    console.log(e.target.value)
    this.setState({
      query: e.target.value
    })
  }

  formatResults(r) {
    console.log(r);
    this.setState({
      hitCount: r.hits.total,
      queryTimeElapsed:  r.took
    })
    return r
  }
  
  formatSummaryStat(){
    if(this.state.hitCount == null) {
      return <p/>
    }
    if(this.state.hitCount == 0) {
      return <p>No results found.</p>
    }
    return <p>{this.state.hitCount} results ({this.state.queryTimeElapsed} milliseconds).</p>
  }

  search(e) {
    console.log("Search query: " + this.state.query)
    //TODO: Replace the following env var with the deployed externally online version when that's ready
    //right now, it depends on an instance of the loci-integration-api deployed locally with ES 
    //and an index populated with <location, label> tuples
    fetch(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT + "/location/find-by-label?query=" + this.state.query)
        .then(res => res.json())
        .then(
          (result) => {
            this.setState({
              queryResults: this.formatResults(result)
            });
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

  validateHandler = () => {
    console.log(this.queryString.current)
  }
  
  render() {
    console.log(this.state.queryResults)
    var hits = null;
    if(this.state.queryResults) {
      hits = this.state.queryResults.hits.hits.map((item,key) => <div className="search-result-block" key={item._source.label}> <div className="search-result-label">{item._source.label} </div><div className="search-uri"> Loc-I ID: <Link to={`/resource?id=${item._source.uri}`}>{item._source.uri}</Link></div></div>);
    }

    return (
      <Container fluid='true'>
        <Row>
          <Col sm={6}>
            <h2>Search</h2>
            <InputGroup className="mb-3">
              <FormControl
                //onChange={() => updateQuery()}
                onChange={this.handleChange}
                placeholder="Search by location label, e.g. NSW"
                aria-label="Search by location label"
                aria-describedby="basic-addon"
                onKeyPress={event => {
                  if (event.key === "Enter") {
                    this.search();
                  }
                }}
              />
              <InputGroup.Append>
                <Button onClick={() => this.search()} variant="outline-secondary">
                  <FontAwesomeIcon icon={faSearch} />
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
          
        </Row>  
        <Row>
          <Col sm={8}>
                {this.formatSummaryStat()}
                {hits}
          </Col>
          <Col sm={4}>
          </Col>
        </Row>
      </Container>
    )
  }
}