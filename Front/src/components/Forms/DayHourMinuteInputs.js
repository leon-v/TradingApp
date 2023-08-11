import React, { Component } from 'react';
import Input from './Input';

class DayHourMinuteInputs extends Component {
    constructor(props) {
        super(props);
        this.state = this.props.value;
    }

    onChange(change) {
        this.setState(
            change,
            function(){
                if (this.props.onChange) {
                    this.props.onChange(this.state);
                }
            }
        );
    }


    render() {
        return (
            <label>
                {this.props.label || 'Label'}:
                <Input
                    label="Days"
                    onChange={(days) => this.onChange({days: days})}
                    value={this.state.days}

                />
                <Input
                    label="Hours"
                    onChange={(hours) => this.onChange({hours: hours})}
                    value={this.state.hours}
                />
                <Input
                    label="Minutes"
                    onChange={(minutes) => this.onChange({minutes: minutes})}
                    value={this.state.minutes}
                />
            </label>
        );
    }
}

export default DayHourMinuteInputs;
