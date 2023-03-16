import express, { Express, Request, Response } from 'express';
import system from 'system-commands';
import { pick } from 'lodash';

const app: Express = express();

app.use(express.json());

app.post('/', async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const output = await system(`docker inspect ${body.image}`);
        if (output.length == 0) {
            res.status(404).send('error')
        }
        
        const result = JSON.parse(output)[0]
  
        const answer = pick(result, 'Created', 'Parent', 'Author', 'ContainerConfig.Hostname', 'ContainerConfig.Cmd', 'RootFS')
        res.json(answer);
    } catch (error) {
        res.status(404).send({error})
    }
});

export default app;