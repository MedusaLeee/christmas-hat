#!/usr/bin/env node
const args = process.argv;
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const Promise = require('bluebird');
const AipFaceClient = require("baidu-aip-sdk").face;

const inputImgPath = args[2];
const outputImgPath = args[3];
console.log('inputImgPath: ', inputImgPath);
console.log('outputImgPath: ', outputImgPath);
if (!inputImgPath || !fs.existsSync(inputImgPath)) {
    throw new Error(`example: './src/index.js inputImgPath outputImgPath' 'inputImgPath'不存在...`);
}

if (!outputImgPath) {
    throw new Error(`example: './src/index.js inputImgPath outputImgPath' 'outputImgPath'不存在...`);
}
if (path.extname(outputImgPath).toLowerCase() !== '.png') {
    throw new Error(`example: './src/index.js inputImgPath outputImgPath' 'outputImgPath'必须为png格式...`);
}

// 设置APPID/AK/SK
const APP_ID = '创建应用的APP_ID';
const API_KEY = '创建应用的API_KEY';
const SECRET_KEY = '创建应用的SECRET_KEY';
const HAT_IMAGE_PATH = `${__dirname}/image/hat.png`;

const wearHat = async() => {
    console.log('开始人脸检测...');
    const client = new AipFaceClient(APP_ID, API_KEY, SECRET_KEY);
    const personImage = fs.readFileSync(inputImgPath).toString('base64');
    const options = {
        max_face_num: '5',
        face_fields: 'landmark'
    };
    const { result_num, result } = await client.detect(personImage, options);
    if (result_num <= 0) {
        throw new Error('未检测到人脸...');
    }
    console.log(`图片中检测到 ${result_num} 个人脸，开始给每个人戴圣诞帽...`);
    // 给每个人戴帽子，循环处理帽子大小和位置
    let sum = 1;
    const endBuffer = await Promise.reduce(result, async(buffer, face) => {
        console.log(`开始给第 ${sum} 个人带圣诞帽...`);
        const personPromise = sharp(buffer);
        const scale = 300/512;
        const location = face.location;
        const hatBuffer = await sharp(HAT_IMAGE_PATH)
            .resize(parseInt(location.width/scale), null, {
                kernel: sharp.kernel.lanczos2,
                interpolator: sharp.interpolator.nohalo
            })
            .png()
            .toBuffer();
        const hatMeta = await sharp(hatBuffer).metadata();
        const wearedBuffer = personPromise.overlayWith(hatBuffer, {
            top: location.top - (hatMeta.height-parseInt(hatMeta.height*(110/512))),
            left: location.left - parseInt(hatMeta.width*(150/512)/2)
        }).png().toBuffer();
        sum = sum + 1;
        return Promise.resolve(wearedBuffer);
    }, inputImgPath);
    console.log('戴圣诞帽结束，导出图片...');
    fs.writeFileSync(outputImgPath, endBuffer);
    console.log('戴圣诞帽完成...');
};


wearHat().then().catch((err) => {
    console.log('戴圣诞帽错误: ', err);
});