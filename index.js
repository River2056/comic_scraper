const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 轉生史萊姆首頁
const baseUrl = 'https://m.comicbus.com/comic/manga-13313.html';
// https://i.8899.buzz/comic/comic-13313.html?ch=1-1
let comicUrl = 'https://i.8899.buzz/comic/comic-13313.html';
let startChapter = 1;
const timeOut = 3000;

let volumns = 0;

if(!fs.existsSync(`./output/`)) {
    fs.mkdirSync(`./output/`);
}

axios.get(baseUrl)
.then(async res => {
    const $ = cheerio.load(res.data);
    volumns = $('#rp_ctl01_0_dl_0 a').length;
    console.log(`total volumns: ${volumns}`);
    for(let i = 0; i < volumns; i++) {
        let episode = (i + 1) < 10 ? '0' + (i + 1) : (i + 1);
        if(!fs.existsSync(`./output/${episode}`)) {
            fs.mkdirSync(`./output/${episode}`);
        }
        await fetchComic(comicUrl, episode);
    }
})
.catch(err => console.log(err));

const fetchComic = async (url, chapter) => {
    let comicUrlList = [];
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(`${url}?ch=${chapter}-1`);
    const totalPagesOfVolumn = await page.$eval('#pageindex', elem => elem.options.length);
    console.log(`totalPagesOfVolumn: ${totalPagesOfVolumn}`);

    for(let i = 1; i <= totalPagesOfVolumn; i++) {
        await page.waitForSelector('#TheImg');
        await page.waitForTimeout(timeOut);
        let imageSrc = await page.$eval('#TheImg', elem => elem.src);
        console.log(imageSrc);
        axios({
            method: 'get',
            url: imageSrc,
            responseType: 'stream'
        })
        .then(res => {
            res.data.pipe(fs.createWriteStream(`./output/${chapter}/${i}.jpg`));
        })
        .catch(err => console.log(err));
        await page.goto(`${url}?ch=${chapter}-${i + 1}`);
    }
    await browser.close();
}