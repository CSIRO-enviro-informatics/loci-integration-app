import React, { createRef, useState, Component } from 'react'
import {    
    Link    
  } from "react-router-dom";
export default class Datasets extends Component {
    constructor(props) {
      super(props);
      this.state = {
        error: null,
        isLoaded: false,
        datasets: []
      };
    }
  
    componentDidMount() {
      fetch(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT + "/datasets?count=1000&offset=0")
        .then(res => res.json())
        .then(
          (result) => {
            this.setState({
              isLoaded: true,
              datasets: result.datasets
            });
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
        )
    }
  
    render() {
      const { error, isLoaded, datasets } = this.state;
      if (error) {
        return <div><h1>Datasets</h1> <p>Error: {error.message}</p></div>;
      } else if (!isLoaded) {
        return <div> <h1>Datasets</h1> Loading...</div>;
      } else {
        return (
            <div>
            <h1>Datasets</h1>
            <ul>
                {datasets.map(d => (
                <li key={d}>
                    <Link to={`/resource?id=${d}`}>{d}</Link>
                </li>
                ))}
            </ul>
          </div>
        );
      }
    }
  }