
import DcmImageInfo from './classes/DcmImageInfo';
import Twix from './classes/twix'; // we can use only pure javascript code in a web worker

self.onmessage = (evt) => {
    console.log(evt.data);

    Twix.ajax({
        url: "http://localhost:8090/image/file/" + evt.data.id,
        type: "GET",
        error: function (err) {
            console.log(err);

            let dcmImage = new DcmImageInfo();
            dcmImage.threadError = -1;
            dcmImage.pRGBAImg = err;
            self.postMessage(dcmImage);
        },
        success: function(data) {
            let obj = JSON.parse(data);

            let dcmImage = new DcmImageInfo();
            dcmImage.tag = evt.data.tag;
            dcmImage.imgId = evt.data.id;
            dcmImage.setFromJson(obj);
            self.postMessage(dcmImage);
        }
    });
};