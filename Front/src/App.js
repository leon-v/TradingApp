import "./App.css";
import React from 'react';
import TimeSeriesChart from './components/TimeSeriesChart/TimeSeriesChart';

const App = () => {
    return (
        <div className="App">
            <TimeSeriesChart endpoint="/api/MarketHistory/last" width="50%" height={400} minScale={50000} roundScale={-3}/>
            <TimeSeriesChart endpoint="/api/MarketHistory/trend" width="50%" height={400} />
            <TimeSeriesChart endpoint="/api/MarketHistory/delay" width="50%" height={200} />
            <TimeSeriesChart endpoint="/api/MarketHistory/change" width="50%" height={200} />
        </div>
    );
};

export default App;