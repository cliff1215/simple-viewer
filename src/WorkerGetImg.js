
import DcmImageInfo from './classes/DcmImageInfo';
import axios from 'axios';
//import Twix from './classes/twix'; // we can use only pure javascript code in a web worker

self.onmessage = (evt) => {
    console.log(evt.data);
    axios.get(
        'http://localhost:3000/api/image/file/' + evt.data.id
    ).then((response) => {
        //let obj = JSON.parse(response.data); // in the case of Java Spring Boot Server
        let obj = response.data; // in the case of Node.JS Server
        let dcmImage = new DcmImageInfo();
        dcmImage.tag = evt.data.tag;
        dcmImage.imgId = evt.data.id;
        dcmImage.setFromJson(obj);
        self.postMessage(dcmImage);
    }).catch((err) => {
        console.log(err);
        
        let dcmImage = new DcmImageInfo();
        dcmImage.threadError = -1;
        dcmImage.pRGBAImg = err;
        self.postMessage(dcmImage);
    });
//-------------------Fetch--------------------------
    // fetch(
    //     'http://localhost:3000/api/image/file/' + evt.data.id
    // ).then(
    //     (res) => res.json()
    // ).then((data) => {
    //     //let obj = JSON.parse(data); // in the case of Java Spring Boot Server
    //     let obj = data; // in the case of Node.JS Server
    //     let dcmImage = new DcmImageInfo();
    //     dcmImage.tag = evt.data.tag;
    //     dcmImage.imgId = evt.data.id;
    //     dcmImage.setFromJson(obj);
    //     self.postMessage(dcmImage);
    // }).catch((err) => {
    //     console.log(err);
    //     let dcmImage = new DcmImageInfo();
    //     dcmImage.threadError = -1;
    //     dcmImage.pRGBAImg = err;
    //     self.postMessage(dcmImage);
    // });
//-------------------Twix--------------------------
    // Twix.ajax({
    //     //url: "http://localhost:8090/image/file/" + evt.data.id,
    //     url: "http://localhost:3000/api/image/file/" + evt.data.id,
    //     type: "GET",
    //     error: function (err) {
    //         console.log(err);

    //         let dcmImage = new DcmImageInfo();
    //         dcmImage.threadError = -1;
    //         dcmImage.pRGBAImg = err;
    //         self.postMessage(dcmImage);
    //     },
    //     success: function(data) {            
    //         //let obj = JSON.parse(data); // in the case of Java Spring Boot Server
    //         let obj = data; // in the case of Node.JS Server

    //         let dcmImage = new DcmImageInfo();
    //         dcmImage.tag = evt.data.tag;
    //         dcmImage.imgId = evt.data.id;
    //         dcmImage.setFromJson(obj);
    //         self.postMessage(dcmImage);
    //     }
    // });
};