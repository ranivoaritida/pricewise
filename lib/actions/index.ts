"use server"

import Product from "../models/product.model";
import { revalidatePath } from "next/cache";
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

        console.log(product.title);

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


        const newProduct = await Product.findOneAndUpdate(
            { url:scrapedProduct.url },
             product,
            { upsert: true, new: true} // si product n'existe pas dans le bdd il va etre créé
        );
        //on doit revalider pour que sa soit automatiquement updater
        revalidatePath(`/products/${newProduct._id}`);

    } catch (error:any) {
        throw new Error(`Failed to create/update product: ${error.message}`)
    }
}

export async function getProductById(productId: String){
    try {
        connectToDB();

        const product = await Product.findOne({ _id: productId });

        if(!product) return null;

        return product;

    } catch (error) {
        console.log(error);
    }
}

export async function getAllProducts() {
    try {
        connectToDB();

        const products = await Product.find();

        return products;
        
    } catch (error) {
        console.log(error)
    }
}

export async function getSimilarProduct(productId: String) {
    try {
        connectToDB();

        const currentProduct = await Product.findById(productId);

        if(!currentProduct) return null;

        const similarProduct = await Product.find({
            _id: {$ne: productId }, //$ne not equal to the  current product id
        }).limit(3);

        return similarProduct;

    } catch (error) {
        console.log(error);
    }
}