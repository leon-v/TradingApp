import React, { Component } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

class TimeSeriesChart extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            loading: true,
            error: null,
        };
        this.endpointQuery = null;
    }

    componentDidMount() {
        this.updateData();
    }

    componentDidUpdate() {
        this.updateData();
    }

    updateData() {

        if (this.endpointQuery === this.props.endpointQuery) {
            return;
        }

        this.endpointQuery = this.props.endpointQuery;

        this.setState({ loading: true });

        const uri = this.props.endpoint + '?' + new URLSearchParams(this.endpointQuery);

        fetch(uri)
            .then(response => response.json())
            .then(data => {
                this.setState({ data: data, loading: false });
            })
            .catch(error => {
                this.setState({ error: 'Error fetching data', loading: false });
            });
    }

    timeFormatter(tick) {

        const date = new Date(tick);

        const options = {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZoneName: 'short'
        };

        const formattedDate = date.toLocaleDateString(undefined, options).replace(',', '') +
            "\r\n" + date.toLocaleTimeString(undefined, options);

        return formattedDate;
    }

    render() {
        let { data, loading, error } = this.state;

        if (loading) {
            return <div>Loading...</div>;
        }

        if (error) {
            return <div>Error: {error}</div>;
        }

        data = data.timestamp.map((timestamp, index) => ({
            date: new Date(timestamp * 1000).getTime(), // Convert Unix timestamp to milliseconds
            value: data.value[index],
        }));

        data = data.sort((a, b) => a.date - b.date);

        // Calculate the Y-axis domain based on the data
        let minYValue = Math.min(...data.map(item => item.value));
        let maxYValue = Math.max(...data.map(item => item.value));

        if (this.props.minScale) {
            let scaleRange = Math.abs(maxYValue - minYValue);
            if (scaleRange < this.props.minScale) {
                let mid = (minYValue + maxYValue) / 2;
                minYValue = mid + (this.props.minScale / 2);
                maxYValue = mid - (this.props.minScale / 2);
            }
        }

        if (this.props.roundScale) {
            if (this.props.roundScale < 0) {
                let multiplier = Math.pow(10, -this.props.roundScale);
                minYValue = Math.round(minYValue / multiplier) * multiplier;
                maxYValue = Math.round(maxYValue / multiplier) * multiplier;
            }
        }

        const CustomTick = ({ x, y, payload }) => {
            const date = new Date(payload.value); // Convert value to a Date object
            const dateFormat = 'MMM dd, yyyy'; // Adjust date format as needed
            const timeFormat = 'HH:mm'; // Adjust time format as needed

            return (
                <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy="-1em" textAnchor="middle" fill="#666">
                        {date.toLocaleDateString(undefined, { dateFormat })}
                    </text>
                    <text x={0} y={0} dy="1em" textAnchor="middle" fill="#666">
                        {date.toLocaleTimeString(undefined, { timeFormat })}
                    </text>
                </g>
            );
        };

        return (
            <ResponsiveContainer
                width={this.props.width || 200}
                height={this.props.height || 200}
            >
                <LineChart
                    data={data}
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                    <XAxis
                        dataKey="date"
                        type="number"
                        domain={['auto', 'auto']}
                        tick={<CustomTick />}
                        scale="time"
                    />
                    <YAxis domain={[minYValue, maxYValue]} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        );
    }
}

export default TimeSeriesChart;
