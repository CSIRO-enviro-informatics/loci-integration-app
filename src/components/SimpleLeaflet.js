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

  oldCreateBoundaries = jsonData => {
    console.log(jsonData)
    if (!('locations' in jsonData) || jsonData['locations'] == "errorMessage")
    {
      return
    }
    if ("cc" in jsonData["locations"]) {
      console.log("foundCC")
      var ccUri = jsonData["locations"]["cc"][0];
      var splitCCUri = ccUri.split("/");
      var id = splitCCUri[splitCCUri.length - 1];
      var processedUrl = `https://cors-anywhere.herokuapp.com/https://geofabricld.net/contractedcatchment/${id}?_view=geofabric&_format=application/ld+json`;
    } 
    
    console.log(processedUrl)
    if (this.old_url === processedUrl) 
    {
      return;
    }
    var url = processedUrl;
    this.old_url = processedUrl;
    var frame = {
      "@type": "http://www.opengis.net/ont/geosparql#Geometry"
    };
    console.log(url);
    fetch(url)
      .then(res => res.json())
      .then(
        res => {
          console.log(res);
          
          if("@id" in res[0]) {
            console.log("Got the ID of the geom");
            console.log(res[0]["@id"]);
          }

          jsonld.flatten(res, (err, flattened) => {
            console.log("flattened json-ld");
            console.log(flattened);
          });
          

          jsonld.frame(res, frame, (err, framed) => {            
            console.log(framed);

            if("http://www.opengis.net/ont/geosparql#hasGeometry" in framed["@graph"][0]) {
              var geom_uri =
                framed["@graph"][0]["http://www.opengis.net/ont/geosparql#hasGeometry"]["@id"];
              console.log(geom_uri);
                
            }
            else if("http://www.opengis.net/ont/geosparql#asGML" in framed["@graph"][0]) {
              var xml_gml_data =
                framed["@graph"][0]["http://www.opengis.net/ont/geosparql#asGML"][
                  "@value"
                ];
              const reader = XmlReader.create();
              reader.on("done", data => {
                var some_geojson = parseGmlPolygon(data, {
                  transformCoords: (x, y) => [y, x],
                  stride: 2
                });
                console.log(some_geojson);
                some_geojson = reproject.reproject(
                  some_geojson,
                  epsg["EPSG:4283"],
                  epsg["EPSG:4326"]
                );
                console.log(some_geojson);
                this.setState({
                  geojson: some_geojson,
                  hasBoundary: true
                });
                console.log("set_state");
              });
              reader.parse(xml_gml_data);  
            }



          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        error => {
          console.log(error);
          this.setState({
            error
          });
        }
      );
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
