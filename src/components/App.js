import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values
class App extends Component {

  async componentWillMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
  }


  async loadWeb3(){
    if (window.ethereum){
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }

    else if(window.web3){
      window.web3 = new Web3(window.ethereum)
    }

    else{
      window.alert('Non ethereum browser detected. You should consider trying Metamask!')
    }
  }

  async loadBlockchainData(){
    const web3 = window.web3
    //Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
    //Network
    const netwokId = await web3.eth.net.getId()
    const networkData = Decentragram.networks[netwokId]
    if(networkData)
    {
      const decentragram = web3.eth.Contract(Decentragram.abi, networkData.address)
      this.setState({decentragram})
      const imageCount = await decentragram.methods.imageCount().call()
      this.setState({imageCount})
      this.setState({loading : false})
      // Load images
      for (var i = 1; i <= imageCount; i++) {
        const image = await decentragram.methods.images(i).call()
        console.log(image.tip.toString())
        this.setState({
          images: [...this.state.images, image]
        })
      }
      // Sort images. Show highest tipped images first
      this.setState({
        images: this.state.images.sort((a,b) => b.tip - a.tip )
      })
    }
    else{
      window.alert('No Contract Found')
    }
  }

  captureFile = event => {

    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }
  
  uploadImage = description => {
    console.log("Submitting file to ipfs...")

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result)
      if(error) {
        console.error(error)
        return
      }

      this.setState({ loading: true })
      this.state.decentragram.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
      })
    })
  }

  tipImageOwner(id, tipAmount) {
    this.setState({ loading: true })
    this.state.decentragram.methods.tipImageOwner(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      decentragram: null,
      images: [],
      loading: true
    }
    this.uploadImage = this.uploadImage.bind(this)
    this.tipImageOwner = this.tipImageOwner.bind(this)
    this.captureFile = this.captureFile.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
            images={this.state.images}
            captureFile={this.captureFile}
            uploadImage={this.uploadImage}
            tipImageOwner={this.tipImageOwner}
            />
          }
      </div>
    );
  }
}

export default App;