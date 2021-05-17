import { cliArguments } from 'cli-argument-parser';
import { expect } from 'chai'
import { RedisBloom } from '../modules/redisbloom';
import { Redis } from '../modules/redis';
let client: RedisBloom;
let redis: Redis;
const key1 = 'key1bloom';
const key2 = '1';
const item1 = 'item1';
const responses = []
let dataIterator: number;
let data: string;

describe('RedisBloom Module testing', async function() {
    before(async () => {
        client = new RedisBloom({
            host: cliArguments.host,
            port: parseInt(cliArguments.port),
        });
        redis = new Redis({
            host: cliArguments.host,
            port: parseInt(cliArguments.port),
        });
        await client.connect();
        await redis.connect();
    })
    after(async () => {
        await client.disconnect();
        await redis.disconnect();
    })
    
    it('reserve function', async () => {
        const response = await client.reserve(key2, 0.01, 100);
        expect(response).to.equal('OK', 'The response of the \'BF.RESERVE\' command');
    })
    it('add function', async () => {
        const response = await client.add(key1, item1)
        expect(response).to.equal(1, 'The response of the \'BF.ADD\' command')
    });
    it('madd function', async () => {
        const response = await client.madd(key1, [item1])
        expect(response[0]).to.equal(0, 'The response of the \'BF.MADD\' command')
    });
    it('insert function', async () => {
        const response = await client.insert(key1, [item1])
        expect(response[0]).to.equal(0, 'The response of the \'BF.INSERT\' command')
    });
    it('exists function', async () => {
        const response = await client.exists(key1, item1)
        expect(response).to.equal(1, 'The response of the \'BF.EXISTS\' command')
    });
    it('mexists function', async () => {
        const response = await client.mexists(key1, [item1])
        expect(response[0]).to.equal(1, 'The response of the \'BF.MEXISTS\' command')
    });
    it('info function', async () => {
        const response = await client.info(key1)
        expect(response[0]).to.equal('Capacity', 'The first item of the information')
        expect(response[1]).to.equal(100, 'The value of the \'Capacity\' item')
    });
    it('scandump function', async () => {
        //responses = [];

//         127.0.0.1:6379> BF.RESERVE 1 0.01 100
// OK
// 127.0.0.1:6379> BF.ADD 1 1
// (integer) 1
// 127.0.0.1:6379> BF.ADD 1 2
// (integer) 1
// 127.0.0.1:6379> BF.ADD 1 3
// (integer) 1
// 127.0.0.1:6379> BF.SCANDUMP 1 0
// 1) (integer) 1
// 2) "\x03\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x05\x00\x00\x00\x02\x00\x00\x00\x90\x00\x00\x00\x00\x00\x00\x00\x80\x04\x00\x00\x00\x00\x00\x00\x03\x00\x00\x00\x00\x00\x00\x00{\x14\xaeG\xe1zt?\xe9\x86/\xb25\x0e&@\b\x00\x00\x00d\x00\x00\x00\x00\x00\x00\x00\x00
//    "\x03\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x05\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x00\x00\x00\x00\x00\x00\x03\x00\x00\x00\x00\x00\x00\x00{\x14�G�zt?�/�5\x0E&@\b\x00\x00\x00d\x00\x00\x00\x00\x00\x00\x00\x00"   
        // await client.add(key2, '1')
        // await client.add(key2, '2')
        // await client.add(key2, '3')
        let iter = 0;
        let response = await client.scandump(key2, iter)
        let data = response[1]
        const chunks = [{iterator: iter, data: data}]
        iter = parseInt(response[0])
        while(iter != 0){
            response = await client.scandump(key2, iter)
            iter = parseInt(response[0])
            data = response[1]
            chunks.push({iterator: iter, data: data})
        }

        console.log(chunks)

        // console.log(await client.redis.del(key2));
        // console.log(await client.redis.get(key2));
        const chunk = chunks[1];
        const res = await client.loadchunk(key2, chunk.iterator, chunk.data);
            expect(res).to.equal('OK', `The response of load chunk with iterator ${chunk.iterator}`)
        // for(const chunk of chunks) {
        //     console.log(chunk)
        //     const res = await client.loadchunk(key1, chunk.iterator, chunk.data);
        //     expect(res).to.equal('OK', `The response of load chunk with iterator ${chunk.iterator}`)
        // }

        // chunks = []
        // iter = 0
        // while True:
        //     iter, data = BF.SCANDUMP(key, iter)
        //     if iter == 0:
        //         break
        //     else:
        //         chunks.append([iter, data])

        // # Load it back
        // for chunk in chunks:
        //     iter, data = chunk
        //     BF.LOADCHUNK(key, iter, data)
    });
    it.skip('loadchunk function', async () => {
        await client.redis.del(key2);
        for(const res of responses) {
            console.log(`\n=== ${res[0]} ===`)
            console.log(Buffer.from(res[1], 'ascii').toString('hex'))
            console.log(Buffer.from(res[1], 'ascii').toString('ascii'))
            console.log(Buffer.from(res[1], 'ascii').toString('base64'))
            console.log(Buffer.from(res[1], 'ascii').toString('binary'))
            console.log(Buffer.from(res[1], 'ascii').toString('utf-8'))
            console.log(Buffer.from(res[1], 'ascii').toString('utf8'))
            console.log(Buffer.from(res[1], 'ascii').toString('utf16le'))
            console.log(await client.loadchunk(key2, res[0], Buffer.from(res[1], 'ascii').toString('utf8')))
        }
        //const response = await client.loadchunk(key2, dataIterator, data)
        //console.log(response)
    });
});