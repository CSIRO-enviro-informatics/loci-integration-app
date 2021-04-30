import React, { createRef, useState, Component } from 'react'

export default class WaitingWidget extends Component {
    constructor(props) {
      super(props);
    }
  
    componentDidMount() {
    }
  
    render() {
      return (<div><img src="/spinner.gif"/></div>)
    }
  }