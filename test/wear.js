const personInfo = require('./result-3.json');
const sharp = require('sharp');
const path = require('path');
// 每个人的帽子大小=人脸width/帽子原图width等比缩放
// 帽子的x坐标=人脸距离图片上边缘的距离(left)-缩放后帽子width的1/2
// 帽子的y坐标=人脸距离图片上边缘的距离（top）
// ffmpeg -i gallery-2.jpg -s 820*540 -y image1.jpg
const personImage = `${__dirname}/fanghua-3.jpeg`;
const hatImage = path.join(__dirname, '../src/hat.png');
const first = {
    x: 609,
    y: 126,
    width: 63
};

const waerHat = async() => {
    const scale = 300/512;
    const hatBuffer = await sharp(hatImage)
        .resize(parseInt(first.width/scale), null, {
            kernel: sharp.kernel.lanczos2,
            interpolator: sharp.interpolator.nohalo
        })
        .png()
        .toBuffer();
    const hatMeta = await sharp(hatBuffer).metadata();
    // 戴帽子
    await sharp(personImage)
            .overlayWith(hatBuffer, {
                top: first.y - hatMeta.height,
                left: first.x - parseInt(hatMeta.width*(150/512)/2)
            })
            .png()
            .toFile('./test/weared.png');    
};

waerHat().then();

// sharp(hatImage).metadata().then((m) => {
//     console.log('m---', m);
// });