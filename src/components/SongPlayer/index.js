import { Component } from 'react'

export class SongPlayer extends Component {
    constructor(props){
        super(props);
        this.state = {
            playing: false,
            audio : new Audio(process.env.PUBLIC_URL + '/assets/songs/' + this.props.fileName)
        }
    }

    componentDidMount(){
        //this.state.playing ? this.state.audio.play() : this.state.audio.pause();
        console.log("AudioPlayer componentDidMount : " + this.state.playing);
        if(this.state.playing){
            console.log("play");
            this.state.audio.play().then(() => console.log("play success")).catch(error => {
                console.log("error");
                console.log(error);
            });
            console.log("song played");
        }
        else {
            console.log("pause");
            this.pause()
        }
    }

    toggle(){
        console.log("toggle");
        this.setState({
            playing: !this.state.playing
        })
        if(!this.state.playing){
            console.log("play");
            this.state.audio.play().then(() => console.log("play success")).catch(error => {
                console.log("error");
                console.log(error);
            });
            console.log("song played");
        }
        else {
            console.log("pause");
            this.pause()
        }
    }

    pause(){
        console.log("pausee");
        this.state.audio.pause();
    }

    render() {
        return null
    }
}

export default SongPlayer

