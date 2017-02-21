import React, { Component } from 'react';
import './App.css';

// TODO: handle not results gracefully (msg) + next should be disabled

// TODO: handle search with no arguments
// https://api.twitch.tv/kraken/search/channels?query=*
// https://api.twitch.tv/kraken/streams/:16764225
// fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
const DEFAULT_QUERY = '*';

const PATH_BASE = 'https://api.twitch.tv/kraken';
const PATH_SEARCH = '/search';
const OBJECT_CHANNELS = 'channels';
const OBJECT_STREAMS = 'streams';

const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const CLIENT_IT = "bm7ifyx69m7j6yo8t39b43gb70etra";
const PARAM_HPP = 'hitsPerPage=';

class App extends Component {
  constructor(props){
    super(props);
    this.state ={
      results: null,
      searchTerm: DEFAULT_QUERY,
      isLoading: true,
    };

    this.setSearchResults = this.setSearchResults.bind(this);
    this.searchChannelsandSrteams = this.searchChannelsandSrteams.bind(this)
    this.onSearchSubmit = this.onSearchSubmit.bind(this)
    this.onSearchChange = this.onSearchChange.bind(this)
    this.onClickMore = this.onClickMore.bind(this)
  }

  // general method to access the api
  fetchResources(object,isSearch,QueryParam,completeURL){
    this.setState({isLoading: true});
    return new Promise ((fulfill, reject)=>{
      let URL = null;
      if(completeURL){
        URL = completeURL;
      }
      else if (isSearch) {
        URL =`${PATH_BASE}${PATH_SEARCH}/${object}?${PARAM_SEARCH}${QueryParam}`;
      } else {
        URL = `${PATH_BASE}/${object}/${QueryParam}`;
      }
      console.log('fetchResources URL', URL);

      var data = fetch(URL,{
        headers: {
            "Client-ID": "bm7ifyx69m7j6yo8t39b43gb70etra"
          },
      })
        .then(response => response.json())
        .then(results => {
          fulfill(results);
        }
      )
        .catch(function(ex) {
          console.log('parsing failed', ex);
          reject(ex);
        });

    });
  }
// searches for channels and then the streams that belong to that channel one by one
// return an array of channels. the streams are embeded within the channels
// the method ends up by setting the state which will in turn render
  searchChannelsandSrteams(QueryParam, completeURL){
    let args = [];
    if (QueryParam) {
      args = [OBJECT_CHANNELS,true,QueryParam,];
    } else {
      args = [,,,completeURL];
    }
    // TODO: beautify this method or split into several ones
    let temp_results = [];
    console.log("searchChannelsandSrteams start");
    return new Promise((fulfill,reject)=>{
      // start by getting channels
      this.fetchResources.apply(this,args)
        .then((results)=>{
          if (results) { // to make sure we could iterate over channels
            temp_results = results;
            temp_results.streamArrayPromises = [];
            temp_results.channels.map(channel=>{
              temp_results.streamArrayPromises.push(new Promise((fulfill, reject) => {
              this.fetchResources(OBJECT_STREAMS,false,channel.display_name.replace(/\s/g,''))
                .then(temp_results=>fulfill(temp_results))
                .catch(err=>console.log('Err in fetch straem',channel._id,err))
              }))
            })
            Promise.all(temp_results.streamArrayPromises)
            .then((streamPromisesResult) => {
              temp_results['streamPromisesResult'] = streamPromisesResult;
              temp_results.streamPromisesResult.map((item,index)=>{
                // place stream next inside its channel
                temp_results.channels[index]['streams'] = item;
              })
              fulfill(temp_results);
            })
    } else{ fulfill(temp_results);} // case no results came back from search for channels
    })
    .catch((err) => {'Err in searchChannelsandSrteams',err})
  })
}
  // set the results as component state
  setSearchResults(new_results){
    const {results} = this.state;

    let channels = [];
    if (new_results) {
      if (new_results.channels) {
        channels = new_results.channels;
      }
    }
    let oldChannels = [];
    if (results) {
      if (results.channels) {
        oldChannels = results.channels;
      }
    }

    const updatedChannels = [
      ...oldChannels,
      ...channels
    ];

    console.log('old channels: ', oldChannels);
    console.log('channels: ', channels);
    console.log('updated channels: ', updatedChannels);

    const _links = new_results._links;



    this.setState({
      results: {
        ['channels']: updatedChannels,
        ['_links']: _links,
      },
      isLoading: false
    });
    console.log('setting search results', results);
  }

  onSearchChange(event){
    console.log('event.target.value',event.target.value);
    this.setState({
      searchTerm: event.target.value
    })
    console.log('this.state.searchTerm',this.state.searchTerm);
    event.preventDefault();
  }

  onSearchSubmit(event){
    console.log('event when clicking search',event);
    this.setState({
      results: null
    })
    this.searchChannelsandSrteams(this.state.searchTerm)
    // TODO: generelize it
    .then((results) => {
      console.log('finished');
      this.setSearchResults(results);
    })
    .catch((err) => {console.log('err',err)})
    event.preventDefault();
  }

  onClickMore(){
    console.log('Will issue new request for: ' + this.state.results._links['next'] );
    this.searchChannelsandSrteams(null,this.state.results._links['next'])
    // TODO: generelize it
    .then((results) => {
      console.log('finished');
      this.setSearchResults(results);
    })
    .catch((err) => {console.log('err',err)})
  }



 // standard react components
  componentDidMount(){
    console.log('componentDidMount');
    this.searchChannelsandSrteams(DEFAULT_QUERY)
      .then((results) => {
        console.log('finished');
        this.setSearchResults(results);
      })
      .catch((err) => {console.log('err',err)})
  }

  render() {
    const {
      results,
      isLoading,
    } = this.state;
    console.log('app.render.results', results);

    return (
      <div className="App">
        <div className="header">
            <div className="header-title">Twitch Viewer</div>
              <Search className="header-search"
                onSubmit={this.onSearchSubmit}
                onChange={this.onSearchChange}
                />
        </div>


        <Table
          results={results} />
          <div>
            <ButtonWithLoading
              className='searchButton'
              isLoading={isLoading}
              onClick ={this.onClickMore}
              >
              More?
            </ButtonWithLoading>
          </div>
      </div>
    );
  }
}

// Search Component
const Search = ({
  onSubmit,
  onChange,
  className ='',
}) => (
  <form className={className}
    onSubmit={onSubmit}
    >
    <input
      className='searchText'
      type="text"
      placeholder="search text"
      onChange={onChange}
      />
    <button
      className='searchButton'
      type="submit">
      search
    </button>
  </form>
);

// Table Component


class Table extends Component{
  renderStream(channel){
    if (channel.streams.stream === null) {
      console.log(channel.streams.stream);
      return(
        <div>Offline</div>
      );
    } else {
      console.log(channel.streams.stream);
      return(
        <div>
          <a href={channel.url}>Online</a>
        </div>
      );
    }

  }
  render(){
    const {
      results
    } = this.props;
    console.log('table.results:', results);
    return(
      <div>
        <div className='table-header'>
          <span style={{ width:'40%'}}>IMG</span>
          <span style={{ width:'30%'}}>NAME</span>
          <span style={{ width:'30%'}}>ONLINE</span>
        </div>

        { results ? (
          results.channels.map(channel=>
          <div key={channel._id} className='table-row'>
            <span style={{ width:'40%'}}>
              <img
                src={channel.logo}
                className='table-row-img'/>
            </span>
            <span
              className='table-row-txt'
              style={{ width:'30%'}}>{channel.display_name}</span>
            <span
              className='table-row-txt'
              style={{ width:'30%'}}>{this.renderStream(channel)}</span>
          </div>
          )
        )

          : <span>No results</span>

        }


      </div>
    )
  }
}

class Button extends Component{
  render(){
    const {
      onClick,
      children,
      className='',
    } = this.props;

    return (
      <button
        onClick={onClick}
        type='button'
        className={className}
        >
        {children}
      </button>
    )
  }
}

// Loading Component
const Loading = () =>
  <div>LOADING....</div>

// withLoading Component
const withLoading = (Component)=>({isLoading, ...rest})=>
  isLoading? <Loading /> : <Component {...rest} />

const ButtonWithLoading = withLoading(Button);


export default App;
