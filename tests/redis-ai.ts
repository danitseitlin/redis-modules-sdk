import { cliArguments } from 'cli-argument-parser';
import { expect } from 'chai'
import { AIModel, AIScript, AIScriptInfo, AITensorInfo, RedisAI } from '../modules/redis-ai';
import * as fs from 'fs';
import { Redis } from '../modules/redis';
let client: RedisAI;
let redis: Redis;

describe('AI testing', async function() {
    before(async () => {
        client = new RedisAI({
            host: cliArguments.host,
            port: parseInt(cliArguments.port)
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

    it('tensorset function', async () => {
        let response = await client.tensorset('values-key', 'FLOAT', [2, 2], [1, 2 ,3, 4])
        expect(response).to.eql('OK', 'The response of tensorset')
        response = await client.tensorset('blob-key', 'FLOAT', [1], [Buffer.from('1.11111')])
        expect(response).to.eql('OK', 'The response of tensorset')
    });
    it('tensorget function', async () => {
        let response = await client.tensorget('values-key', 'VALUES', true) as AITensorInfo;
        expect(response.dtype).to.eql('FLOAT', 'The dtype of tensor')
        response = await client.tensorget('blob-key', 'BLOB', true) as AITensorInfo
        expect(response.dtype).to.eql('FLOAT', 'The dtype of tensor')
        response = await redis.ai_module_tensorget('blob-key', 'BLOB', true) as AITensorInfo
        expect(response.dtype).to.eql('FLOAT', 'The dtype of tensor')
    });
    it('modelstore function', async () => {
        const file = fs.readFileSync('./tests/data/models/model1.onnx')
        const response = await client.modelstore('blob-model', 'ONNX', 'CPU', file)
        expect(response).to.eql('OK', 'The response of modelset')
    });
    it('modelget function', async () => {
        const modelName = 'blob-model';
        const response = await client.modelget('blob-model', true, true) as AIModel;
        expect(response.device).to.eql('CPU', `The device of key ${modelName}`)
    });
    it('modelexecute function', async () => {
        let response = await client.tensorset('tensorA', 'FLOAT', [1, 2], [2, 3])
        response = await client.tensorset('tensorB', 'FLOAT', [1, 2], [3, 5])
        const blob = fs.readFileSync('./tests/data/models/graph.pb');
        response = await client.modelstore('mymodel', 'TF', 'CPU', blob, {
            inputs: ['a', 'b'],
            inputsCount: 2,
            outputs: ['c'],
            outputsCount: 1
        })
        expect(response).to.eql('OK', 'The response of modelstore')
        response = await client.modelexecute('mymodel', {
            inputs: ['tensorA', 'tensorB'],
            outputs: ['tensorC'],
            inputsCount: 2,
            outputsCount: 1
        })
        expect(response).to.eql('OK', 'The response of modelexecute')
    });
    it('modelscan function', async () => {
        const response = await client.modelscan();
        expect(response[0][0]).to.eql('mymodel', 'The response of mymodel')
    });
    it('modeldel function', async () => {
        const response = await client.modeldel('blob-model');
        expect(response).to.eql('OK', 'The response of modeldel')
    });
    it('scriptset function', async () => {
        const scriptFileStr = fs.readFileSync('./tests/data/scripts/script.txt').toString();
        const response = await client.scriptset('myscript', {
            device: 'CPU',
            script: scriptFileStr
        });
        expect(response).to.eql('OK', 'The response of scriptset')
    });
    it('scriptget function', async () => {
        const scriptName = 'myscript'
        const response = await client.scriptget(scriptName, true, true) as AIScript;
        expect(response.device).to.eql('CPU', `The device of script ${scriptName}`)
    });
    
    it('scriptrun function', async () => {
        await client.tensorset('tensorA', 'FLOAT', [1, 2], [2, 3]);
        await client.tensorset('tensorB', 'FLOAT', [1, 2], [3, 5]);
        const response = await client.scriptrun('myscript', 'bar', ['tensorA', 'tensorB'], ['tensorC'])
        expect(response).to.eql('OK', 'The response of scriptrun')
    });
    it('scriptscan function', async () => {
        const response = await client.scriptscan();
        expect(response[0][0]).to.eql('myscript', 'The response of scriptscan')
    });
    it('info function', async () => {
        const response: AIScriptInfo = await client.info('myscript') as AIScriptInfo;
        expect(response.key).to.eql('myscript', 'The response of info')
    });
    it('scriptdel function', async () => {
        const response = await client.scriptdel('myscript');
        expect(response).to.eql('OK', 'The response of scriptdel')
    });
    it('config function', async () => {
        const response = await client.config('/usr/lib/redis/modules/backends/')
        expect(response).to.eql('OK', 'The response of config')
    });
    it('dagrun function', async () => {
        const blob = fs.readFileSync('./tests/data/models/graph.pb');
        await client.modelstore('mymodel-dag', 'TF', 'CPU', blob, {
            inputs: ['a', 'b'],
            outputs: ['c'],
            tag: 'test_tag'
        })
        await client.tensorset('tensorA', 'FLOAT', [1, 2], [2, 3]);
        await client.tensorset('tensorB', 'FLOAT', [1, 2], [3, 5]);
        const response = await client.dagrun([
            'AI.TENSORSET tensorA FLOAT INPUTS 1 2 OUTPUTS 3 5',
            'AI.TENSORSET tensorB FLOAT INPUTS 1 2 OUTPUTS 3 5',
            'AI.MODELRUN mymodel-dag INPUTS tensorA tensorB OUTPUTS tensorC'
        ])
        expect(response).to.eql([], 'The response of dagrun')
    });
    it('dagrunRO function', async () => {
        const blob = fs.readFileSync('./tests/data/models/graph.pb');
        await client.modelstore('mymodel-dag', 'TF', 'CPU', blob, {
            inputs: ['a', 'b'],
            outputs: ['c'],
            tag: 'test_tag'
        })
        await client.tensorset('tensorA', 'FLOAT', [1, 2], [2, 3]);
        await client.tensorset('tensorB', 'FLOAT', [1, 2], [3, 5]);
        const response = await client.dagrunRO([
            'AI.TENSORSET tensorA FLOAT INPUTS 1 2 OUTPUTS 3 5',
            'AI.TENSORSET tensorB FLOAT INPUTS 1 2 OUTPUTS 3 5',
            'AI.MODELRUN mymodel-dag INPUTS tensorA tensorB OUTPUTS tensorC'
        ])
        expect(response).to.eql([], 'The response of dagrun_RO')
    });
})