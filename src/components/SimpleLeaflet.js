// @flow

import React, { createRef, Component } from "react";
import { Map, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import hash from "object-hash";
import jsonld from "jsonld";
import parseGmlPolygon from "parse-gml-polygon";
import XmlReader from "xml-reader";
import toWgs84 from "reproject";
import epsg from "epsg";
var reproject = require("reproject");
export default class SimpleLeaflet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasLocation: false,
      hasBoundary: false,
      geojson: {},
      unique_key: new Date(),
      latlng: {
        lat: -25.2744,
        lng: 133.7751
      },
      zoom: 5,
      inputRefFn: props.inputRef,
      pointSelectCallback: props.pointSelectCallback
    };
  }

  mapRef = createRef();
  old_url = "";

  componentDidUpdate(prevProps, prevState) {
    if (this.props.geometryGeojson !== this.state.geojson) {
        this.setState({
          geojson: this.props.geometryGeojson,
          hasBoundary: true
        });
    }
    
  }

  handleClick = e => {
    const map = this.mapRef.current;
    console.log("click");
    console.log(e);
    if (map != null) {
      //map.leafletElement.locate()
      this.setState({
        latlng: e.latlng,
        hasLocation: true
      });
    }
    console.log(this.state);
    /*var url = new URL(' https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-nt.geojson');
    console.log(url);
    fetch(url)
      .then(res => res.json())
      .then(
        (res) => {
          this.setState({
            geojson: res,
            hasBoundary: true
          });
          console.log(res);
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            error
          });
        }
      ); */
    this.state.inputRefFn(this.state.latlng);
    this.state.pointSelectCallback(e);
  };

  //assume jsonData is a geojson geometry
  createBoundaries = jsonData => {
    console.log(jsonData)
    
    if(jsonData != this.state.jsonData) {
      this.setState({
        geojson: jsonData,
        hasBoundary: true
      }); 
    }

    
  };

  handleLocationFound = e => {
    this.setState({
      hasLocation: true,
      latlng: e.latlng
    });
  };

  render() {
   
    const marker = this.state.hasLocation ? (
      <Marker position={this.state.latlng}>
        <Popup> You clicked here </Popup>{" "}
      </Marker>
    ) : null;
    var geojson_layer = this.state.hasBoundary ? (
      <GeoJSON key={hash(this.state.geojson)} data={this.state.geojson} />
    ) : null;
    return (
      <Map
        center={this.state.latlng}
        length={4}
        onClick={this.handleClick}
        //onLocationfound={this.handleLocationFound}
        ref={this.mapRef}
        zoom={this.state.zoom}
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {marker} {geojson_layer}{" "}
      </Map>
    );
  }
}
