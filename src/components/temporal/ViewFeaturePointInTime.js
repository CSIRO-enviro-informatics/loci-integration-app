import React, { createRef, useState, Component } from 'react'
import Button from "react-bootstrap/Button";
import DatePicker from "react-datepicker";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import ToggleButton from "react-bootstrap/ToggleButton";
import ButtonGroup from "react-bootstrap/ButtonGroup";

import "react-datepicker/dist/react-datepicker.css";

export default class ViewFeaturePointInTime extends Component {
    constructor(props) {
      super(props);
      
      this.handleChange = this.handleChange.bind(this);
      this.handleChange2 = this.handleChange2.bind(this);
      this.fetchFeatureInfoCallbackFn = this.fetchFeatureInfoCallbackFn.bind(this);
      this.fetchFeatureInfoCallbackFn2 = this.fetchFeatureInfoCallbackFn2.bind(this);

      this.fetchFeatureGeomCallbackFn = this.fetchFeatureGeomCallbackFn.bind(this);
      this.fetchFeatureGeomCallbackFn2 = this.fetchFeatureGeomCallbackFn2.bind(this);

      var uiDate = new Date();
      const regex = /[0-9][0-9][0-9][0-9]-[0-9][0-9]$/g;

      let matches = this.props.featureURI.match(regex);
      if(matches != null && matches.length > 0) {
        //turn first match in to a date
        uiDate = new Date(Date.parse(matches[0]));
      }

      this.state = {
        featureURI: this.props.featureURI,
        startDate: uiDate,
        comparisonStartDate: uiDate,
        isWaiting: false,
        comparisonMode: false,
        featureInfo: {},
        resultCode: 0,
        isWaiting2: false,
        featureInfo2: {},
        resultCode2: 0
      }
    }
  
    componentDidMount() {
    }

    handleChange(date, e) {
      this.setState({
        startDate: date
      })
    }

    
    handleChange2(date, e) {
      this.setState({
        comparisonStartDate: date
      })
    }
      
    goBack = (e) => {
      this.props.renderComparisonGeometryFn(null);
      this.props.renderSelectedGeometryFn(null);
      this.props.showCurrentResults();
    }
  
    fetchFeatureInfoCallbackFn(result) {
      const here = this;
      this.setState({
        featureInfo: result,
        isWaiting: false
      });
      console.log(result);

      if("code" in result) {
        if(result['code'] == 500)  {
          here.setState({
            resultCode: 500                  
          })
          return;
        }
        else{
          this.setState({
            resultCode: 200,
            featureInfo: result
          })
        }
      }      
      this.fetchFeatureGeom(result['uri'], this.fetchFeatureGeomCallbackFn, function() {
        here.setState({
          isWaiting: true
        });
      });
    }

    fetchFeatureInfoCallbackFn2(result) {
      this.setState({
        featureInfo2: result,
        isWaiting2: false
      });
      console.log(result);

      if("code" in result) {
        if(result['code'] == 500)  {
          this.setState({
            resultCode2: 500  ,
            featureInfo: result,               
          })
          return;
        }
        else{
          this.setState({
            resultCode2: 200                  
          })
        }
      }     
      const here = this; 
      this.fetchFeatureGeom(result['uri'], this.fetchFeatureGeomCallbackFn2, function() {
        here.setState({
          isWaiting2: true
        });
      });
    }

    fetchFeatureGeomCallbackFn(result, ) {
      this.setState({
        geojson: result,
        isWaiting: false
      });
      console.log(result);
      this.props.renderSelectedGeometryFn(result);
    }

    fetchFeatureGeomCallbackFn2(result) {
      this.setState({
        geojson2: result,
        isWaiting2: false
      });
      console.log(result);
      this.props.renderComparisonGeometryFn(result);
    }

    getFeatureInfo = (e) => {
      //this.props.showCurrentResults();
      console.log(this.state.startDate);
      this.setState({
         isWaiting : true
        }
      );
      const fmtDate = this.state.startDate.toISOString().slice(0, 10);
      this.fetchFeatureInfo(this.state.featureURI, fmtDate, this.fetchFeatureInfoCallbackFn);
    }

    getFeatureInfo2 = (e) => {
      //this.props.showCurrentResults();
      console.log(this.state.comparisonStartDate);
      this.setState({
         isWaiting2 : true
        }
      );
      const fmtDate = this.state.comparisonStartDate.toISOString().slice(0, 10);
      this.fetchFeatureInfo(this.state.featureURI, fmtDate, this.fetchFeatureInfoCallbackFn2);      
    }

    fetchFeatureInfo(featureURI, fmtTime, callbackFn) {
      console.log("fetchFeatureInfo");
      var here = this;
      this.setState({
        resultCode: 0
      });
      var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
        + "/temporal/feature"),
        params = {
          uri: featureURI,
          time: fmtTime
        }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      console.log(url);
      
      fetch(url)
        .then(res => res.json())
        .then(
          (result) => {
            callbackFn(result, here)            
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

    fetchFeatureGeom(theUri, callbackFn, waitingFn) {
      console.log("fetchFeatureGeom");
      var here = this;
      var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
        + "/location/geometry"),
        params = {
          uri: theUri
        }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      console.log(url);
      waitingFn(here);
      fetch(url)
        .then(res => res.json())
        .then(
          (result) => {
            callbackFn(result, here);
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

    formatFeatureInfo() {
      var arrDivs = [];      
      if(this.state.featureInfo !={}) {
        arrDivs.push(<div class='featureHeader'>Feature Info</div>)
      }

      for (var prop in this.state.featureInfo) {        
        if (Object.prototype.hasOwnProperty.call(this.state.featureInfo, prop)) {
            arrDivs.push((<div>
              <span class='featureInfoKey'>{prop}</span><span class='featureInfoValue'>{this.state.featureInfo[prop]}</span>
            </div>))
        }
      }
      return arrDivs;
    }


    formatFeatureInfo2() {
      var arrDivs = []
      
      if(this.state.featureInfo2 !={}) {
        arrDivs.push(<div class='featureHeader'>Feature Info</div>)
      }

      for (var prop in this.state.featureInfo2) {
        
        if (Object.prototype.hasOwnProperty.call(this.state.featureInfo2, prop)) {
            arrDivs.push((<div>
              <span class='featureInfoKey'>{prop}</span><span class='featureInfoValue'>{this.state.featureInfo2[prop]}</span>
            </div>))
        }
      }
      return arrDivs;
    }


    getFormStructure(startDate, onChangeFn, viewFeatureBtnFn, validArrDivsOrSpinner) {
      return (
        <div>
          <p>Select a point in time:</p>
          <DatePicker
            utcOffset={0}
            selected={ startDate }
            onChange={ function(date, e) {
              return onChangeFn(date, e, this);
            } }
            name="startDate"
            dateFormat="dd/MM/yyyy"
          />     
          <br/>
          <p>
            <Button variant="outline-primary" size="sm" onClick={(e) => viewFeatureBtnFn(e)}>
                    View feature
          </Button>
          </p>
          <div className="viewFeatureResult">
             {validArrDivsOrSpinner}
          </div>
        </div>
      );
    }

    toggleCompareMode() {      
      const toggleMode = !this.state.comparisonMode;
      this.setState({
        comparisonMode: toggleMode
      });
    }

    render() {
      var here = this;
     
      var arrMessage = "";
      var arrMessage2 = "";

      if(this.state.resultCode == 500) {
        arrMessage = "Error: " + this.state.featureInfo['message'];
      }
      else{
        arrMessage = this.formatFeatureInfo()
      }

      if(this.state.resultCode2 == 500) {
        arrMessage2 = "Error: " + this.state.featureInfo['message'];
      }
      else{
        arrMessage2 = this.formatFeatureInfo2()
      }

      var validArrDivsOrSpinner = (this.state.isWaiting) ?
      (
        <div><img src="/spinner.gif"/></div>        
      )
      :
      <div>{arrMessage}</div>;

      var validArrDivsOrSpinner2 = (this.state.isWaiting2) ?
      (
        <div><img src="/spinner.gif"/></div>        
      )
      :
      <div>{arrMessage2}</div>;
      
      var formStructure = this.getFormStructure(this.state.startDate, this.handleChange, here.getFeatureInfo, validArrDivsOrSpinner)
      var formStructure2 = this.getFormStructure(this.state.comparisonStartDate, this.handleChange2, here.getFeatureInfo2, validArrDivsOrSpinner2)

      var mainUI = formStructure;

      if(this.state.comparisonMode) {
        mainUI = (
          <Tabs defaultActiveKey="main" id="uncontrolled-tab-example">
            <Tab eventKey="main" title="Main feature">
              {formStructure}
            </Tab>
            <Tab eventKey="comparison" title="Comparison feature">
              {formStructure2}
            </Tab>              
          </Tabs>     
          )
      }

      return (
        <div>
          <div>
          <Button variant="outline-primary" size="sm" onClick={(e) => here.goBack(e)}>
                    Back to results
          </Button>
          </div>
          <div>
            <h3>View Feature Info at a Point In Time</h3>
            <p>Feature URI: {this.state.featureURI}</p>
            <ButtonGroup toggle className="mb-2">
              <ToggleButton
                type="checkbox"
                variant="secondary"
                checked={this.state.comparisonMode}
                value="1"
                onChange={(e) => here.toggleCompareMode()}
              >
                Compare
              </ToggleButton>
            </ButtonGroup>
          </div>
          {mainUI}
        </div>
      )
    }
  }