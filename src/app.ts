import express, { Express, Request, Response } from 'express';
import system from 'system-commands';
import { pick } from 'lodash';

const app: Express = express();

app.use(express.json());

async function isExist(name: string) {
    try {
        return await system(`docker inspect ${name}`);
    } catch (error) {
        if (error === `Error: No such object: ${name}`) {
            console.log('error');
            
            await system(`docker pull ${name}`);
            return await system(`docker inspect ${name}`);
        }
        throw new Error(error as string);
    }
}

app.post('/', async (req: Request, res: Response) => {
    try {
        const name = req.body.name;

        const output = await isExist(name);
 
        if (output.length == 0) {
            res.status(404).send('error')
        }

        const result = JSON.parse(output)[0]

        const answer = pick(result, 'Created', 'Parent', 'Author', 'ContainerConfig.Hostname', 'ContainerConfig.Cmd', 'RootFS')
        res.json(answer);
    } catch (error) {
        res.status(404).send({ error })
    }
});

export default app;