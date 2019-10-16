import React, { createRef, useState, Component } from 'react'
import queryString from 'query-string';
import {
  BrowserRouter as Router,
  Link,
  useLocation
} from "react-router-dom";

export default class Resource extends Component {
    constructor(props) {
      super(props);
      this.state = {
        error: null,
        isLoaded: false,
      };
      
    }
  
    componentDidMount() {
      //get queryParams
      var location = window.location.search;
       
      const parsed = queryString.parse(location);
      console.log(parsed);
      

      fetch("https://api.loci.cat/api/v1/resource?uri=" +parsed.id)
        .then(res => res.json())
        .then(
          (result) => {
            this.setState({
              isLoaded: true,
              //resource: JSON.stringify(result)
              resource: result              
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
    renderResourceAsTable() {
      const v = Object.keys(this.state.resource);
      
      const arr = v.map((p, index) => {
        console.log(p)
        const val = JSON.stringify(this.state.resource[p])
        console.log(val)
        
        return (
           <tr key={index}>
              <td>{p}</td>
              <td>{val}</td>

           </tr>
        )
     })
     console.log(arr);
     return arr;
    }
    render() {
      const { error, isLoaded, resource } = this.state;
      if (error) {
        return <div><h1>Resource</h1> <p>Error: {error.message}</p></div>;
      } else if (!isLoaded) {
        return <div> <h1>Resource</h1> Loading...</div>;
      } else {
        return (
            <div>
            <h1>Resource</h1>
            <table id='resource'>
               <tbody>
                 <tr>
                  <th>Property</th>
                  <th>Value</th>
                  </tr>

               {this.renderResourceAsTable()}
               </tbody>
            </table>
          </div>
        );
      }
    }
  }
