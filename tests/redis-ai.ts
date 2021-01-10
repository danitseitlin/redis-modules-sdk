import { cliArguments } from 'cli-argument-parser';
import { expect } from 'chai'
import { RedisAI } from '../modules/redis-ai';
let client: RedisAI;
const key1 = 'key1cmk'
const key2 = 'key1cmk2';

describe('AI testing', async function() {
    before(async () => {
        client = new RedisAI({
            host: cliArguments.host,
            port: parseInt(cliArguments.port),
        });
        await client.connect();
    })
    after(async () => {
        await client.disconnect();
    })

    it(' function', async () => {
        const response = await client.tensorset('my-key', 'DOUBLE', 'shape')
        console.log(response)
    });
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //it(' function', async () => {
    //    
    //});
    //
});