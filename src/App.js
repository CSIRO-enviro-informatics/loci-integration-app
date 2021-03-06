import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useLocation,
  useParams
} from "react-router-dom";
import { withRouter } from 'react-router'

import SimpleLeaflet from './components/SimpleLeaflet'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import FindByPointComponent from "./components/FindByPointComponent";
import Datasets from "./components/Datasets"
import Locations from "./components/Locations"
import Linksets from "./components/Linksets"
import Resource from "./components/Resource"
import SearchPageComponent from "./components/SearchPageComponent";

export default function App() {
  
  return (
    <Router>
      <div>
        <ul  className="nav">
          <li>
            <Link to="/">
                 <span className="logo"><img id='logo' src="loci-logo.png"/></span> 
                 Loc-I Explorer
            </Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>         
        </ul>

        <Switch>
          <Route path="/tools">
            <LociTools />
          </Route>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/search">
            <SearchPageComponent />
          </Route>
          <Route path="/datasets">
            <Datasets />
          </Route>
          <Route path="/linksets">
            <Linksets />
          </Route>
          <Route path="/locations">
            <Locations />
          </Route>
          <Route path="/resource">
            <Resource />
          </Route>
          <Route path="/">            
            <FindByPointComponent />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function About() {
  return (
     <div>
        <h2>About</h2>
        <p>Prototype interfaces using the <a href="https://api.loci.cat">Loc-I Integration API</a>.</p>
        <p>Please note this site is in development and is available for demonstration purposes only.</p>
        <p>Check out more information about the Loc-I project at <a href="http://locationindex.org/">http://locationindex.org/</a></p>
     </div>
  );
}


// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
  return new URLSearchParams(useLocation().search);
}


function LociTools() {
  let match = useRouteMatch();

  return (
    <div>
      <h2>Loc-I Tools</h2>

      <ul>
        <li>
          <a href='http://excelerator.loci.cat/'>Excelerator</a>
        </li>
        <li>
          <a href='http://excelerator.loci.cat/iderdown'>IDerDown</a>
        </li>
      </ul>
    </div>
  );
}

function Topics() {
  let match = useRouteMatch();

  return (
    <div>
      <h2>Topics</h2>

      <ul>
        <li>
          <Link to={`${match.url}/components`}>Components</Link>
        </li>
        <li>
          <Link to={`${match.url}/props-v-state`}>
            Props v. State
          </Link>
        </li>
      </ul>

      {/* The Topics page has its own <Switch> with more routes
          that build on the /topics URL path. You can think of the
          2nd <Route> here as an "index" page for all topics, or
          the page that is shown when no topic is selected */}
      <Switch>
        <Route path={`${match.path}/:topicId`}>
          <Topic />
        </Route>
        <Route path={match.path}>
          <h3>Please select a topic.</h3>
        </Route>
      </Switch>
    </div>
  );
}

function Topic() {
  let { topicId } = useParams();
  return <h3>Requested topic ID: {topicId}</h3>;
}