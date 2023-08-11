import React, { Component } from 'react';

class Input extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.value
        };
    }

    onChange(event) {
        this.setState(
            { value: event.target.value },
            function(){
                if (this.props.onChange) {
                    this.props.onChange(this.state.value);
                }
            }
        );
    }

    render() {
        return (
            <label>
                {this.props.label || 'Label'}:
                <input
                    value={this.state.value}
                    type={this.props.type || 'text'}
                    onChange={this.onChange.bind(this)}
                    placeholder={this.props.placeholder || this.props.label || 'Placeholder'}
                />
            </label>
        );
    }
}

export default Input;
