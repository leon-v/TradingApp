import "./App.css";
import React, { Component } from 'react';
import TimeSeriesChart from './components/TimeSeriesChart/TimeSeriesChart';
import ChartControlForm from './components/ChartControlForm/ChartControlForm';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            hours: 8,
        };
    }

    setHours(hours) {
        this.setState({ hours: hours });
    }

    render() {
        return (
            <div className="App">
                <ChartControlForm setValue={this.setHours.bind(this)} value={this.state.hours}/>
                <TimeSeriesChart
                    endpoint="/api/MarketHistory/last"
                    endpointQuery={{hours: this.state.hours}}
                    width="50%"
                    height={400}
                    minScale={50000}
                    roundScale={-3}
                />
                <TimeSeriesChart
                    endpoint="/api/MarketHistory/trend"
                    endpointQuery={{hours: this.state.hours}}
                    width="50%"
                    height={400}
                />
                <TimeSeriesChart
                    endpoint="/api/MarketHistory/delay"
                    endpointQuery={{hours: this.state.hours}}
                    width="50%"
                    height={200}
                />
                <TimeSeriesChart
                    endpoint="/api/MarketHistory/change"
                    endpointQuery={{hours: this.state.hours}}
                    width="50%"
                    height={200}
                />
            </div>
        )
    };
};

export default App;