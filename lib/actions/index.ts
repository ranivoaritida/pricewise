"use server"

import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapedAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";

export async function scrapeAndStoreProduct(productUrl:string){
    if(!productUrl) return;
    try {
        connectToDB();
        
        const scrapedProduct = await scrapedAmazonProduct(productUrl);

        if(!scrapedProduct) return;

        let product = scrapedProduct;

        const existingProduct = await Product.findOne({ url: scrapedProduct.url });

        if(existingProduct){
            const updatedPriceHistory : any = [
                ...existingProduct.priceHistory,
                {price: scrapedProduct.currentPrice}
            ]

            product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory),
            }
        }

        consts newProduct = await Product.findOneAndUpdate({
            url:scrapedProduct.url,
            
        })



    } catch (error:any) {
        throw new Error(`Failed to create/update product: ${error.message}`)
    }
}