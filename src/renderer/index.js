import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import InputWindow from './components/InputWindow';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/input" element={<InputWindow />} />
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
