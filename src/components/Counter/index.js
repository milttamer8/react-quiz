import React from 'react';

export default class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: this.props.allottedTime,
      running: true,
    }
  }

  componentDidMount(){
    console.log("componentDidMount");
    this.handleStart();
  }
  
  componentDidUpdate(prevProps, prevState) {
    if(this.state.running !== prevState.running){
      switch(this.state.running) {
        case true:
          this.handleStart();
      }
    }
  }

  componentWillUnmount() {
    console.log("Greeting unmounted...");
    clearInterval(this.timer);
  }
  
  handleStart() {
    var countdown = this.props.allottedTime;
    this.timer = setInterval(() => {
      countdown--;

      if(countdown === 0){
        clearInterval(this.timer);
        console.log("timeup");
        this.handleTimeUp();
      }
    }, 1000);
  }
  
  handleStop() {
    if(this.timer) {
      clearInterval(this.timer);
      this.setState(
        {running:false}
      );      
    }
  }

  handleTimeUp(){
    this.handleStop();
    this.props.timeUp();
  }
  
  render() {
    return null;
  }
}