import "./App.css";
import React, { Component } from 'react';
import TimeSeriesChart from './components/TimeSeriesChart/TimeSeriesChart';
import DayHourMinuteInputs from './components/Forms/DayHourMinuteInputs';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            range:{
                days: 0,
                hours: 8,
                minutes: 0,
            },
            offset:{
                days: 0,
                hours: 0,
                minutes: 0,
            }
        };

        this.range = this.state.range;
        this.offset = this.state.offset;
    }

    submit(event) {
        event.preventDefault();
        this.setState({
            range: this.range,
            offset: this.offset,
        });
    }

    render() {
        const endpointQuery = {
            rangeDays: this.state.range.days,
            rangeHours: this.state.range.hours,
            rangeMinutes: this.state.range.minutes,
            offsetDays: this.state.offset.days,
            offsetHours: this.state.offset.hours,
            offsetMinutes: this.state.offset.minutes,
        };
        return (
            <div className="App">
                <form onSubmit={this.submit.bind(this)}>
                    <DayHourMinuteInputs
                        label="Range"
                        onChange={(range) => { this.range = range}}
                        value={this.state.range}
                    />
                    <br></br>
                    <DayHourMinuteInputs
                        label="Offset"
                        onChange={(offset) => { this.offset = offset}}
                        value={this.state.offset}
                    />
                    <button type="submit">Submit</button>
                </form>
                <TimeSeriesChart
                    endpoint="/api/MarketHistory/last"
                    endpointQuery={endpointQuery}
                    width="50%"
                    height={400}
                    minScale={50000}
                    roundScale={-3}
                />
                <TimeSeriesChart
                    endpoint="/api/MarketHistory/trend"
                    endpointQuery={endpointQuery}
                    width="50%"
                    height={400}
                />
                <TimeSeriesChart
                    endpoint="/api/MarketHistory/delay"
                    endpointQuery={endpointQuery}
                    width="50%"
                    height={200}
                />
                <TimeSeriesChart
                    endpoint="/api/MarketHistory/change"
                    endpointQuery={endpointQuery}
                    width="50%"
                    height={200}
                />
            </div>
        )
    };
};

export default App;