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
    }

    async componentDidMount() {

        try {
            const response = await fetch(this.props.endpoint); // Replace with the correct API endpoint

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const jsonData = await response.json();

            const data = jsonData.timestamp.map((timestamp, index) => ({
                date: new Date(timestamp * 1000).getTime(), // Convert Unix timestamp to milliseconds
                value: jsonData.value[index],
            }));

            // Sort the data by the date field in ascending order
            const sortedData = data.sort((a, b) => a.date - b.date);

            this.setState({ data: sortedData, loading: false });
        } catch (error) {
            this.setState({ error: 'Error fetching data', loading: false });
        }
    }

    render() {
        const { data, loading, error } = this.state;

        if (loading) {
            return <div>Loading...</div>;
        }

        if (error) {
            return <div>Error: {error}</div>;
        }

        // Calculate the Y-axis domain based on the data
        let minYValue = Math.min(...data.map(item => item.value));
        let maxYValue = Math.max(...data.map(item => item.value));

        if (this.props.minScale) {
            let scaleRange = Math.abs(maxYValue - minYValue);
            console.log(minYValue, maxYValue);
            if (scaleRange < this.props.minScale) {
                let mid = (minYValue + maxYValue) / 2;
                minYValue = mid + (this.props.minScale / 2);
                maxYValue = mid - (this.props.minScale / 2);
            }
            console.log(minYValue, maxYValue);
        }

        if (this.props.roundScale) {
            if (this.props.roundScale < 0) {
                let multiplier = Math.pow(10, -this.props.roundScale);
                minYValue = Math.round(minYValue / multiplier) * multiplier;
                maxYValue = Math.round(maxYValue / multiplier) * multiplier;
                console.log('Rounded', minYValue, maxYValue);
            }
        }

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
                        tickFormatter={(tick) => new Date(tick).toLocaleString()}
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
