import "./App.css";
import React from 'react';
import TimeSeriesChart from './components/TimeSeriesChart/TimeSeriesChart';

const App = () => {
    return (
        <div className="App">
            <h4>Price</h4>
            <TimeSeriesChart
                endpoint="/api/MarketHistory/last"
            />
            <hr></hr>
            <hr></hr>
            <h4>Trend +/-</h4>
            <TimeSeriesChart
                endpoint="/api/MarketHistory/trend"
            />
            <hr></hr>
            <h4>Time to change</h4>
            <TimeSeriesChart
                endpoint="/api/MarketHistory/delay"
            />
            <h4>Change in price</h4>
            <TimeSeriesChart
                endpoint="/api/MarketHistory/change"
            />
        </div>
    );
};

export default App;