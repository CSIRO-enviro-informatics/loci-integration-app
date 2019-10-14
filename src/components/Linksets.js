import React, { createRef, useState, Component } from 'react'

export default class Linksets extends Component {
    constructor(props) {
      super(props);
      this.state = {
        error: null,
        isLoaded: false,
        linksets: []
      };
    }
  
    componentDidMount() {
      fetch("https://api.loci.cat/api/v1/linksets?count=10&offset=0")
        .then(res => res.json())
        .then(
          (result) => {
            this.setState({
              isLoaded: true,
              linksets: result.linksets
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
      const { error, isLoaded, linksets } = this.state;
      if (error) {
        return <div><h1>Linksets</h1> <p>Error: {error.message}</p></div>;
      } else if (!isLoaded) {
        return <div> <h1>Linksets</h1> Loading...</div>;
      } else {
        return (
            <div>
            <h1>Linksets</h1>
            <ul>
                {linksets.map(l => (
                <li key={l}>
                    <a href={`/resource?id=${l}`}>{l}</a>
                </li>
                ))}
            </ul>
          </div>
        );
      }
    }
  }