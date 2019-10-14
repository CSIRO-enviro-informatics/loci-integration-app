import React, { createRef, useState, Component } from 'react'

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
      fetch("https://api.loci.cat/api/v1/datasets?count=1000&offset=0")
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
                    <a href={`/resource?id=${d}`}>{d}</a>
                </li>
                ))}
            </ul>
          </div>
        );
      }
    }
  }