// @flow

import React, { createRef, Component } from "react";
import { Leaflet, Map, TileLayer, Marker, Popup, GeoJSON, FeatureGroup, LatLng } from "react-leaflet";
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
      mounted: false,
      geojson: {},
      comparisonGeojson: {},
      unique_key: new Date(),
      latlng: {
        lat: -25.2744,
        lng: 133.7751
      },
      zoom: 5,
      inputRefFn: props.inputRef,
      pointSelectCallback: props.pointSelectCallback
    };
    this.groupRef = createRef();
    this.groupRef2 = createRef();

    this.mapRef = createRef();
    this.zoomRef = createRef();

  }

  

  old_url = "";

  componentDidUpdate(prevProps, prevState) {
    if (this.props.geometryGeojson !== this.state.geojson) {
      if(this.props.geometryGeojson !== 'undefined')  {
          this.setState({
            geojson: this.props.geometryGeojson,
            hasBoundary: true
          });        
      }
        console.log("Map updated!");
        console.log(this.state.geojson);
        if(this.state.mounted) {
          
        }  
    }
    if (this.props.comparisonGeometryGeojson !== this.state.comparisonGeojson) {
      if(this.props.comparisonGeometryGeojson !== 'undefined')  {

        this.setState({
          comparisonGeojson: this.props.comparisonGeometryGeojson,
          hasBoundary: true
        });        
      }
      console.log("Map updated!");
      console.log(this.state.comparisonGeojson);
      if(this.state.mounted) {
        
      }  
  }
    console.log("map updated")
    if( this.state.geojson != null && this.state.geojson !== 'undefined' && Object.keys(this.state.geojson).length !== 0) {
      const map = this.mapRef.current.leafletElement;
      const group = this.groupRef.current.leafletElement;
      var bounds = group.getBounds();

      if(bounds && Object.keys(bounds).length === 0 && bounds.constructor === Object) {
        console.log("empty bounds. skipping map fit bounds/setview");
      }
        //detect if bounds is a point
      else if( (bounds._northEast.lat == bounds._southWest.lat) && (bounds._northEast.lng == bounds._southWest.lng)) {
        bounds._northEast.lat += 0.000000000001;
        bounds._northEast.lng += 0.000000000001;
        map.setView([bounds._northEast.lat, bounds._northEast.lng], 15);
        this.setState({zoom: 15});
      }
      else {
        console.log(bounds);
        map.fitBounds(bounds);
      }
    }

    if( this.state.comparisonGeojson != null && this.state.comparisonGeojson !== 'undefined' && Object.keys(this.state.comparisonGeojson).length !== 0) {
      const map = this.mapRef.current.leafletElement;
      const group = this.groupRef2.current.leafletElement;
      var bounds = group.getBounds();

      //detect if bounds is a point
      if( (bounds._northEast.lat == bounds._southWest.lat) && (bounds._northEast.lng == bounds._southWest.lng)) {
        bounds._northEast.lat += 0.000000000001;
        bounds._northEast.lng += 0.000000000001;
        map.setView([bounds._northEast.lat, bounds._northEast.lng], 15);
        this.setState({zoom: 15});
      }
      else {
        console.log(bounds);
        map.fitBounds(bounds);
      }
    }
  }

  componentDidMount() {
    console.log("map mounted")
   
  }

  handleClick = e => {
    const map = this.mapRef.current;
    console.log("click");
    console.log(e);
    if (map != null) {
      //map.leafletElement.locate()
      const zoom  = map.leafletElement.getZoom();
      this.setState({
        latlng: e.latlng,
        hasLocation: true,
        geojson: null,
        comparisonGeojson: null,
        zoom: zoom
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
    //clear the geojson
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

  styleGeom = () => {
    return {
      // the fillColor is adapted from a property which can be changed by the user (segment)
      fillColor: '#3388ff',
      weight: 1,
      //stroke-width: to have a constant width on the screen need to adapt with scale 
      opacity: 1,
      color: '#3388ff',
      fillOpacity: 0.5
    };
  }
  
  styleComparisonGeom = () => {
    return {
      // the fillColor is adapted from a property which can be changed by the user (segment)
      fillColor: 'red',
      weight: 0.3,
      //stroke-width: to have a constant width on the screen need to adapt with scale 
      opacity: 1,
      color: 'black',
      fillOpacity: 0.5
    };
  }

  render() {
   
    const marker = this.state.hasLocation ? (
      <Marker position={this.state.latlng}>
        <Popup> You clicked here </Popup>{" "}
      </Marker>
    ) : null;
    var geojson_layer = ( this.state.hasBoundary && this.state.comparisonGeojson !== 'undefined' )? (
      <GeoJSON key={hash(this.state.geojson)} data={this.state.geojson} style={this.styleGeom()}/>
    ) : null;

    var comparison_geojson_layer = (this.state.hasBoundary && (typeof this.state.comparisonGeojson !== 'undefined') )? (
      <GeoJSON key={hash(this.state.comparisonGeojson)} data={this.state.comparisonGeojson} style={this.styleComparisonGeom()} />
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
        {marker} 
        <FeatureGroup ref={this.groupRef}>
          {geojson_layer}
        </FeatureGroup>
        <FeatureGroup ref={this.groupRef2}>
          {comparison_geojson_layer}
        </FeatureGroup>
        {" "}
      </Map>
    );
  }
}
