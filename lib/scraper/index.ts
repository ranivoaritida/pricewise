import axios from "axios";
import * as cheerio from 'cheerio';
import { extractCurrency, extractPrice } from "../utils";


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

        const outOfStock = sa('availability span').text().trim().toLowerCase() === 'currently unavailable';

        const images = 
            sa('#imgBlkFront').attr('data-a-dynamic-image') ||
            sa('#landingImage').attr('data-a-dynamic-image') ||
            '{}';
        
        const imageUrls = Object.keys(JSON.parse(images));

        const currency = extractCurrency(sa('.a-price-symbol'));
        const discountRate = sa('.savingsPercentage').text().trim().replace(/[-%]/g,"");

        //data object

        const data = {
            url,
            currency:currency || '$',
            image:imageUrls[0],
            title,
            currentPrice:Number(currentPrice),
            originalPrice:Number(originalPrice),
            priceHistory:[],
            discountRate:Number(discountRate),
            category:'category',
            reviewCount:100,
            stars:4.5,
            isOutOfStock:outOfStock
        }
        console.log(data)




    } catch (error:any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }

}