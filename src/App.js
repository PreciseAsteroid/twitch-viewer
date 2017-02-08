import React, { Component } from 'react';
import './App.css';


class App extends Component {
  constructor(props){
    super(props);
    this.state ={
      results: null,
    };
    this.fetchSearchStreams = this.fetchSearchStreams.bind(this);
    this.setSearchResults = this.setSearchResults.bind(this);
  }

  fetchSearchStreams(){
    console.log('fetchSearchStreams');
    fetch("https://api.twitch.tv/kraken/search/channels?query=*",{
      headers: {
          "Client-ID": "bm7ifyx69m7j6yo8t39b43gb70etra"
        },
    })
      .then(response => response.json())
      .then(results => this.setSearchResults(results))
      .catch(function(ex) {
        console.log('parsing failed', ex)
        })
  }

  setSearchResults(results){
    this.setState({
      results,
    });
    console.log('setting search results', results);
  }

  componentDidMount(){
    console.log('componentDidMount');
    this.fetchSearchStreams();
  }
  render() {
    const {
      results,
    } = this.state;
    console.log('app.render.results', results);

    return (
      <div className="App">
        <h2>Twitch Viewer</h2>
        <Search />
        <Table
          results={results} />
      </div>
    );
  }
}

// Search Component
const Search = () => (
  <form>
    <input
      type="text"/>
    <button
      type="submit">
      search button
    </button>
  </form>
);

// Table Component
class Table extends Component{
  render(){
    const {
      results
    } = this.props;
    console.log('table.results:', results);
    return(
      <div>
        <div className='Table-Header'>
          <span>IMG</span>
          <span>CHANNEL DISPLAY NAME</span>
          <span>ONLINE</span>
          <span>ONLINE</span>
          <span>LINK</span>
        </div>

        { results ? (
          results.channels.map(channel=>
          <div key={channel._id} className='Table-row'>
            <span>{channel._id}</span>
            <span>{channel.display_name}</span>
            <span>
              <img src={channel.logo} alt="logo" height="42" width="42" />
            </span>

          </div>
          )
        )

          : <span>No results</span>

        }


      </div>
    )
  }
}

export default App;
