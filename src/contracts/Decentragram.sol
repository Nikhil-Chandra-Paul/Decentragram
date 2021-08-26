pragma solidity ^0.5.0;

contract Decentragram {
  // Code goes here...
  string public name="Decentragram";

  //events
  event ImageCreated(
    uint id,
    string hash,
    string description,
    uint tip,
    address payable author
  );

    event ImageTipped(
    uint id,
    string hash,
    string description,
    uint tip,
    address payable author
  );

  //store images
  mapping(uint =>Image) public images;
  uint public imageCount = 0;

    struct Image {
    uint id;
    string hash;
    string description;
    uint tip;
    address payable author;
  }

  //create images
  function uploadImage(string memory _imgHash, string memory _description) public{
    require(bytes(_description).length > 0, "Error...");
    require(bytes(_imgHash).length > 0, "Error...");
    require(msg.sender != address(0x0), "Error...");

    imageCount++;
    images[imageCount]=Image(imageCount, _imgHash, _description, 0, msg.sender);
    emit ImageCreated(imageCount, _imgHash, _description, 0, msg.sender);
  }

  //tip images
  function tipImageOwner(uint _id) public payable{

    require(_id > 0 && _id <= imageCount);

    Image memory _image = images[_id];

    address payable _author = _image.author;

    address(_author).transfer(msg.value);

    _image.tip += msg.value;

    images[_id] = _image;

    emit ImageTipped(_id, _image.hash, _image.description, _image.tip, _author);


  }
}