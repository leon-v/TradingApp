import React, { Component } from 'react';

class ChartControlForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.value
        };
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.setValue(this.state.value);
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
                <label>
                    Hours:
                    <input
                        value={this.state.value}
                        onChange={this.handleChange.bind(this)}
                        placeholder="Hours"
                    />
                </label>
            </form>
        );
    }
}

export default ChartControlForm;
