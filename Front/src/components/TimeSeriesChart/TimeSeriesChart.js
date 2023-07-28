import React, { Component } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

class LineChartExample extends Component {
  state = {
    data: [],
    loading: true,
    error: null,
  };

  async componentDidMount() {
    try {
      const response = await fetch('/GetMarketHistory'); // Replace with the correct API endpoint

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const jsonData = await response.json();

      const data = jsonData.timestamp.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).getTime(), // Convert Unix timestamp to milliseconds
        last: jsonData.last[index],
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
    const minYValue = Math.min(...data.map(item => item.last));
    const maxYValue = Math.max(...data.map(item => item.last));
    const yDomain = [minYValue, maxYValue];

    return (
      <LineChart width={600} height={300} data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          dataKey="date"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
          scale="time"
        />
        <YAxis domain={yDomain} />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="last" stroke="#8884d8" dot={false} />
      </LineChart>
    );
  }
}

export default LineChartExample;
