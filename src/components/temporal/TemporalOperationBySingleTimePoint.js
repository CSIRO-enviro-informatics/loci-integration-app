import React, { createRef, useState, Component } from 'react'
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import DatePicker from "react-datepicker";
import geojsonMerge from "@mapbox/geojson-merge";
import "react-datepicker/dist/react-datepicker.css";
import simplify from "@turf/simplify";
import turfArea from "@turf/area";
import geojsonArea from "@mapbox/geojson-area";

export default class TemporalOperationBySingleTimePoint extends Component {
    constructor(props) {
      super(props);
      this.inputNode = '';

      this.handleDateChange = this.handleDateChange.bind(this);
      this.getFetchFeatureInfoPromise = this.getFetchFeatureInfoPromise.bind(this);
      //this.onFormSubmit = this.onFormSubmit.bind(this);
      
      var uiDate = new Date();
      const regex = /[0-9][0-9][0-9][0-9]-[0-9][0-9]$/g;

      let matches = this.props.featureURI.match(regex);
      if(matches != null && matches.length > 0) {
        //turn first match in to a date
        uiDate = new Date(Date.parse(matches[0]));
      }

      let operation = this.props.operation;
      var api = "/temporal/intersects";
      if(operation == "intersects") {
        api = "/temporal/intersects";
      }
      else if(operation == "contains") {
        api = "/temporal/contains";
      }
      else if(operation == "within") {
        api = "/temporal/within";
      }


      this.state = {
        inputFeatureURI: this.props.featureURI,
        featureURI: null,
        targetFeatureType: 'https://linked.data.gov.au/def/asgs#CommonwealthElectoralDivision',
        startDate: uiDate,
        isWaiting: false,
        results: {},
        formattedResultsIdx: {},
        resultCode: 0,
        featureInfoCount: 0,
        resultCode: 0,
        geojson: {},
        geojsonIdx: {},
        sourceGeojson: {},
        arrDivs: [],
        apiEndpoint: api,
        operation: operation,
        waitingFor: { "featureInfo" : {}, "geom": {}}
      }
    }
  
    componentDidMount() {
      var here = this;
      /*
      this.fetchFeatureGeom(this.state.featureURI, function(geojson) {
        here.setState({
          sourceGeojson: geojson
        });
        here.props.renderComparisonGeometryFn(geojson);
      })
      */
      this.updateSourceFeatureUriAndGeom();


    }

    updateSourceFeatureUriAndGeom() {
      //update the feature geom also
      var here = this;
      here.setState({
        isWaiting: true
      });
      
      this.getFetchSourceFeatureInfoPromise().then(data => {
        console.log(data);  
        here.setState({
          isWaiting: false
        });
        
        if(data && data.uri) {
          here.setState({
            featureURI: data.uri
          });
          this.fetchFeatureGeom(data.uri, function(geojson) {
            here.setState({
              sourceGeojson: geojson
            });
            console.log(geojson);
            here.props.renderComparisonGeometryFn(geojson);
          });         
        }
        else if(data && data.code && data.code == 500) {
          console.log("Error!");
          this.setState({
            featureInfo: data,
            formattedResultsIdx: null,
            featureURI: data.message
          });

          if("code" in data) {
            if(data['code'] == 500)  {
              this.setState({
                resultCode: 500                  
              })
              return;
            }
          }        
          
        }
      });
    }

    clearResults() {
      this.setState({
        geojson: {},
        geojsonIdx: {},
        formattedResultsIdx: {},
        arrDivs: [],
      });
      this.props.renderComparisonGeometryFn(null);
      this.props.renderSelectedGeometryFn(null);

    }

    handleDateChange(date) {
      this.setState({
        startDate: date
      });
      //update the feature geom also
      console.log("In handleDateChange");
      this.clearResults();
      this.updateSourceFeatureUriAndGeom();

      //query for the feature at time date
      
    }

    handleDateChangeFeatureType(input) {
      console.log(input);
      console.log(input.currentTarget.value);
      //this.setState({
      //  targetFeatureType: input.currentTarget.value
      //})
    }
      
    goBack = (e) => {
        this.props.renderComparisonGeometryFn(null);
        this.props.renderSelectedGeometryFn(null);
        this.props.showCurrentResults();
    }
  
    getFeatureInfo = (e, uri, startDate, targetFeatureType) => {
      //this.props.showCurrentResults();
      console.log(startDate);
      
      this.setState({
         isWaiting : true
        }
      );
      this.performOperationQuery(uri, startDate, targetFeatureType);
    }

    performOperationQuery(featureURI, startDate, targetFeatureType) {
      console.log("performOperationQuery");
      var here = this;
      this.setState({
        resultCode: 0
      });
      const fmtTime = startDate.toISOString().slice(0, 10);
      var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
        + this.state.apiEndpoint),
        params = {
          uri: featureURI,
          time: fmtTime,
          toFeatureType : targetFeatureType
        }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      console.log(url);
      this.setState({
        isWaiting: true
      });
      fetch(url)
        .then(res => res.json())
        .then(
          (result) => {
            this.setState({
              results: result,
              isWaiting: false
            });
            console.log(result);

            if("code" in result) {
              if(result['code'] == 500)  {
                this.setState({
                  resultCode: 500                  
                })
                return;
              }
            }        
            here.getFormattedResultsIdx();   
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
    fetchFeatureInfo(uri, currDate, callbackFn) {
      console.log("fetchFeatureInfo");
      var here = this;
      var thisWaitingFor = here.state.waitingFor;
      thisWaitingFor['featureInfo'][uri] = true;

      this.setState({
        resultCode: 0,
        waitingFor: thisWaitingFor
      });
      const fmtTime = currDate.toISOString().slice(0, 10);
      var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
        + "/temporal/feature"),
        params = {
          uri: uri,
          time: fmtTime
        }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      console.log(url);
      
      fetch(url)
        .then(res => res.json())
        .then(
          (result) => {
            callbackFn(result, uri);
            var thisWaitingFor = here.state.waitingFor;
            delete thisWaitingFor['featureInfo'][uri];
            this.setState({
              featureInfoCount: (this.state.queue + 1),
              waitingFor: thisWaitingFor
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

    async fetchFeatureInfoAwait(uri, currDate) {
      console.log("fetchFeatureInfo");
      var here = this;
      this.setState({
        resultCode: 0
      });
      const fmtTime = currDate.toISOString().slice(0, 10);
      var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
        + "/temporal/feature"),
        params = {
          uri: uri,
          time: fmtTime
        }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      console.log(url);
      
      const response = await fetch(url);
      const featureInfo = await response.json();
      return featureInfo;        
    }

    fetchFeatureGeom(uri, callbackFn) {
      console.log("fetchFeatureGeom");
      var here = this;
      
      var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
        + "/location/geometry"),
        params = {
          uri: uri
        }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      console.log(url);
      
      fetch(url)
        .then(res => res.json())
        .then(
          (result) => {
            callbackFn(result, uri)            
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

    async fetchFeatureGeomAwait(uri) {
      console.log("fetchFeatureGeom");
      var here = this;
      var thisWaitingFor = here.state.waitingFor;
      thisWaitingFor['geom'][uri] = true;
      here.setState({
        waitingFor: thisWaitingFor
      });

      var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
        + "/location/geometry"),
        params = {
          uri: uri
        }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      console.log(url);
      
      const response = await fetch(url);
      const featureGeom = await response.json();
      thisWaitingFor = here.state.waitingFor;
      delete thisWaitingFor['geom'][uri];
      here.setState({
        waitingFor: thisWaitingFor
      });
      return {'uri': uri , 'geom': featureGeom };      
    }

    getFetchSourceFeatureInfoPromise() {
      var here = this;

      const asyncGetFeatureInfoFn = async item => {
        return here.fetchFeatureInfoAwait(item, here.state.startDate)
      }      
      const getFeatureInfo = async () => {
        if(this.state.inputFeatureURI) {
          return asyncGetFeatureInfoFn(this.state.inputFeatureURI);
        }
        return;        
      }
      return getFeatureInfo();
    }

    getFetchFeatureInfoPromise() {
      var here = this;

      const asyncGetFeatureInfoFn = async item => {
        return here.fetchFeatureInfoAwait(item, here.state.startDate)
      }      
      const getFeatureInfo = async () => {
        if(! ( Object.keys(this.state.results).length === 0 && this.state.results.constructor === Object)) {
          return Promise.all(this.state.results.map(item => asyncGetFeatureInfoFn(item)));
        }
        return;        
      }
      return getFeatureInfo();
    }

    getFormattedResultsIdx() {
      var here = this;
      var currFormattedResultsIdx = this.state.formattedResultsIdx;
      
      const asyncGetFeatureInfoFn = async item => {
        return here.fetchFeatureInfoAwait(item, here.state.startDate)
      }      
      const getFeatureInfo = async () => {
        return Promise.all(here.state.results.map(item => asyncGetFeatureInfoFn(item)))
      }
      this.getFetchFeatureInfoPromise().then(data => {
        here.setState({
          isWaiting: false
        });
        console.log(data);
        data.forEach(elem => {        
          const uri = elem['uri'];
          currFormattedResultsIdx[uri] = elem;
          here.updateResultsIdx(currFormattedResultsIdx); 
        })
      });

      const asyncGetFeatureGeomFn = async item => {
        return here.fetchFeatureGeomAwait(item)
      }      
      const getFeatureGeom = async () => {        
        return Promise.all(here.state.results.map(item => asyncGetFeatureGeomFn(item)))
      }
      getFeatureGeom().then(data => {
        console.log(data);
        var currGeojsonIdx = {};
        data.forEach(elem => {        
          const uri = elem['uri'];
          const geojson = elem['geom'];
          currGeojsonIdx[uri] = geojson;
        });
        var arrGeojson = []
        Object.keys(currGeojsonIdx).forEach(function(key,index) {
          var currGeojson = currGeojsonIdx[key];
          arrGeojson.push(currGeojson);       
        });
        var mergedGeoJSON = geojsonMerge.merge(arrGeojson);

        console.log("geojsonArea!");

        const calcGeojsonArea = turfArea(mergedGeoJSON);
        //simplify the geom
        if(calcGeojsonArea > 4638394323000) {
           var options = {tolerance: 0.001, highQuality: true};
           mergedGeoJSON = simplify(mergedGeoJSON, options);
        }

        here.setState({
          geojsonIdx : currGeojsonIdx,
          geojson: mergedGeoJSON
        }); 
        here.props.renderSelectedGeometryFn(mergedGeoJSON);           
      });

      for (var item in this.state.results) {
        //process each one and render dynamically
        var currFormattedResultsIdx = this.state.formattedResultsIdx;
        var elem = this.state.results[item];
        console.log(elem);
        currFormattedResultsIdx[elem] = {}
        console.log(currFormattedResultsIdx);
        this.fetchFeatureInfo(elem, this.state.startDate, function(res, uri) {
          currFormattedResultsIdx[uri] = res;
          here.updateResultsIdx(currFormattedResultsIdx); 

          here.fetchFeatureGeom(uri, function(geojsonRes, uri) {
            here.updateGeojson(geojsonRes, uri);
          });
        });
      }    
    }

    updateResultsIdx(idx ) {
      this.setState({
        formattedResultsIdx : idx
      });  
    }

    updateGeojson(geojson, uri) {
      var currGeojsonIdx = this.state.geojsonIdx;
      currGeojsonIdx[uri] = geojson;
      var arrGeojson = []
      Object.keys(currGeojsonIdx).forEach(function(key,index) {
        var currGeojson = currGeojsonIdx[key];
        arrGeojson.push(currGeojson);       
      });
      var mergedGeoJSON = geojsonMerge.merge(arrGeojson);
      //const mergedGeoJSONstr = JSON.stringify(mergedGeoJSON);

      this.setState({
        geojsonIdx : currGeojsonIdx,
        geojson: mergedGeoJSON
      });  
    }


    handleSubmit = (e) => {
      const form = e.currentTarget;      
      console.log(form);
      console.log(e);
      //console.log(form.elements.featureType.value);
      const formData = new FormData(e.target),
            formDataObj = Object.fromEntries(formData.entries())
      console.log(formDataObj)

      const featureType = formDataObj.featureType;
      const startDate = formDataObj.startDate;

      e.preventDefault();
      e.stopPropagation();

      this.props.renderSelectedGeometryFn(null);

      this.setState({
        formattedResultsIdx : {},
        featureInfoCount: 0,
        targetFeatureType: featureType
      });   

      this.getFeatureInfo(e, this.state.featureURI, this.state.startDate, featureType);
    }
    

  
    render() {
      var here = this;
      var arrMessage = "";
      var loadingMessage = "";

      if(this.state.resultCode == 500) {
        if(this.state.featureInfo && "message" in this.state.featureInfo) {
         arrMessage = "Error: " + this.state.featureInfo['message'];
        }
        else {
          arrMessage = "Error ";
        }
      }

      var isWaitingFeatureInfoToLoad = false;
      var isWaitingGeomToLoad = false;
      if(this.state.waitingFor) {
        var waitingMessageGeom = '';
        var waitingMessageFeatureInfo = '';

        const currObj = this.state.waitingFor['geom'];
        if(! ( Object.keys(currObj).length === 0 && currObj.constructor === Object)) {
          waitingMessageGeom = "Loading geometries (" + Object.keys(currObj).length + " to go).";
          isWaitingGeomToLoad = true;
        }
        else {
          waitingMessageGeom = "";
          isWaitingGeomToLoad = false;
        }
        const currObj2 = this.state.waitingFor['featureInfo'];
        if(! ( Object.keys(currObj2).length === 0 && currObj2.constructor === Object)) {
          waitingMessageFeatureInfo = "Fetching feature info (" + Object.keys(currObj2).length + " to go).";
          isWaitingFeatureInfoToLoad = true;
        }
        else{
          waitingMessageFeatureInfo = "";
          isWaitingFeatureInfoToLoad = false;
        }
        
        loadingMessage = waitingMessageFeatureInfo + " " + waitingMessageGeom ;
      }
      if(this.state.formattedResultsIdx) {
        var arrDivs = [];

        console.log(this.state.formattedResultsIdx);
        const currObj = this.state.formattedResultsIdx;
        if(! (currObj && Object.keys(currObj).length === 0 && currObj.constructor === Object)) {
          arrDivs.push(<div key='1' className='featureHeader'>Results</div>)
          var resBlock = Object.keys(currObj).map(featureUri => {
              const innerObj = this.state.formattedResultsIdx[featureUri];
              if(! (innerObj && Object.keys(innerObj).length === 0 && innerObj.constructor === Object)) {
                return (
                  <div className="resBlock">
                    <div><h4>{featureUri}</h4></div>
                    {
                        Object.keys(innerObj).map( (key) => {
                        return (<div className="resLine">
                                  <span className='featureInfoKey'>{key}</span><span class='featureInfoValue'>{innerObj[key]}</span>
                                </div>);
                      })}
                  </div>
                );
              }
            });
        } 
        arrDivs.push(resBlock);
        /*for (var featureUri in this.state.formattedResultsIdx) {
          
          arrDivs.push();
          const featureInfo = this.state.formattedResultsIdx[featureUri];
          for (var prop in featureInfo) {
            if (Object.prototype.hasOwnProperty.call(featureInfo, prop)) {
                arrDivs.push((<div className="resLine">
                  <span className='featureInfoKey'>{prop}</span><span class='featureInfoValue'>{featureInfo[prop]}</span>
                </div>))

            }
          }
        }*/
        arrMessage = arrDivs;
      }

      var validArrDivsOrSpinner = (this.state.isWaiting) ?
      (
        <div><img src="/spinner.gif"/></div>        
      )
      :
      <div className='temporalSearchResults'>{arrMessage}</div>;

      var submitDisabledOrNot = false;
      var btnLabel = "Submit";
      if(this.state.isWaiting) {
        submitDisabledOrNot = true; 
        btnLabel = "Loading...";
      }
      else{ 
        btnLabel = "Submit";
        submitDisabledOrNot = false;      
      }

      if(isWaitingFeatureInfoToLoad || isWaitingGeomToLoad) {
        submitDisabledOrNot = true; 
        btnLabel = "Loading...";
      }
      else{ 
        btnLabel = "Submit";
        submitDisabledOrNot = false;      
      }
      
      if(this.state.resultCode == 500) {
        submitDisabledOrNot = true;
      }
      
      
      return (
        <div>
          <div>
          <Button variant="outline-primary" size="sm" onClick={(e) => here.goBack(e)}>
                    Back to results
          </Button>
          </div>
          <div>
            <h3>Temporal {this.state.operation} By Single Time Point</h3>
            <p>Source Feature URI: {this.state.featureURI}</p>

            
          <Form onSubmit={here.handleSubmit}>
          <Form.Group controlId="exampleForm.ControlSelect1" >
              <Form.Label>Point in time</Form.Label>
              <DatePicker
              utcOffset={0}
              selected={ this.state.startDate }
              onChange={ this.handleDateChange }
              name="startDate"
              dateFormat="dd/MM/yyyy"
          />             
          </Form.Group>
            <Form.Group controlId="exampleForm.ControlSelect1" >
              <Form.Label>Feature Type</Form.Label>
              <Form.Control as="select" name="featureType" ref="featureType" onChange={ this.handleDateChangeFeatureType }>
                <option value="https://linked.data.gov.au/def/asgs#CommonwealthElectoralDivision">ASGS Commonwealth Electoral Division</option>
                <option value="https://linked.data.gov.au/def/asgs#StateElectoralDivision">ASGS State Electoral Division</option>
                <option value="https://linked.data.gov.au/def/asgs#LocalGovernmentArea">ASGS Local Government Area</option>
                <option value="https://linked.data.gov.au/def/asgs#StatisticalAreaLevel1">ASGS Statistical Area Level 1</option>
                <option value="https://linked.data.gov.au/def/asgs#StatisticalAreaLevel2">ASGS Statistical Area Level 2</option>
                <option value="https://linked.data.gov.au/def/asgs#StatisticalAreaLevel3">ASGS Statistical Area Level 3</option>
                <option value="https://linked.data.gov.au/def/asgs#StatisticalAreaLevel4">ASGS Statistical Area Level 4</option>
              </Form.Control>
            </Form.Group>
            
            <Button variant="primary" type="submit" disabled={submitDisabledOrNot}>
              {btnLabel}
            </Button>
          </Form>  
          </div>
          {loadingMessage}
          {validArrDivsOrSpinner}
        </div>
      );
    }
  }