import React from "react";
import {LineChart, XAxis, YAxis, CartesianGrid, Line, Tooltip} from "recharts";
import moment from 'moment'

class ReLineChart extends React.Component {
    constructor(properties) {
        super(properties);
        this.state = {
            error: null,
            isLoaded: false,
            items: [],
        };
    }

    componentDidMount() {
        console.log('mount');
        fetch("/GetMarketHistory")
            .then((res) => res.json())
            .then(
                (result) => {
                    this.setState({
                        isLoaded: true,
                        items: result,
                    });
                },
                (error) => {
                    this.setState({
                        isLoaded: true,
                        error,
                    });
                }
            );
    }

    render() {
        const { error, isLoaded, items } = this.state;
        if (error) {
            return <div>Error: {error.message}</div>;
        } else if (!isLoaded) {
            return <div>Loading...</div>;
        } else {
            return (
                <div>
                    <LineChart
                        width={1100}
                        height={500}
                        data={items}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                        <XAxis
                            dataKey = 'timestamp'
                            domain = {['auto', 'auto']}
                            tickFormatter = {(unixTime) => moment(unixTime).format('HH:mm Do')}
                            name = 'Time'
                            // type = 'number'
                        />

                        <YAxis/>
                        <Tooltip />
                        <CartesianGrid stroke="#eee" strokeDasharray="5 5"/>
                        <Line type="monotone" dataKey="last" stroke="#8884d8" />
                    </LineChart>
                </div>
            );
        }
    }
}
export default ReLineChart;
