import axios from "axios";
import * as cheerio from 'cheerio';
import { extractPrice } from "../utils";


export async function scrapedAmazonProduct(url:string){
    if(!url) return ;

    //curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_089c698a-zone-unblocker:ci703hx5z09y -k https://lumtest.com/myip.json//

    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 22225;
    const session_id =(1000000 * Math.random()) | 0;
    const options ={
        auth:{
            username: `${username}-session-${session_id}`,
            password,
        },
        host:'brd.superproxy.io',
        port,
        rejectUnauthorized:false,
    }
    try {
        const response = await axios.get(url,options);
        const sa = cheerio.load(response.data);

        const title = sa('#productTitle').text().trim();
        const currentPrice = extractPrice(
            sa('.priceToPay span.a-price-whole'),
            sa('a.size.base.a-color-price'),
            sa('.a-button-selected .a-color-base'),
            sa('.a-price.a-text-price')
        );

        const originalPrice = extractPrice(
            sa('#priceblock_ourprice'),
            sa('.a-price.a-text-price span.a-offscreen'),
            sa('#listPrice'),
            sa('#priceblock_dealprice'),
            sa('.a-size-base.a-color-price')
        );

        console.log({title,currentPrice});

    } catch (error:any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }

}