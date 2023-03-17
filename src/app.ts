import express, { Express, Request, Response } from 'express';
import system from 'system-commands';
import _, { pick } from 'lodash';
import { promisify } from 'util';
const exec = promisify(require('child_process').exec);

const app: Express = express();

app.use(express.json());

async function isExist(name: string) {
    try {
        return await system(`docker inspect ${name}`);
    } catch (error) {
        if (error === `Error: No such object: ${name}`) { 
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

        const answer = pick(result, 'Id', 'RootFS');
        const imageId = answer.Id;
        const command1 = `docker pull chenzj/dfimage`;
        const command2 = `docker run -v /var/run/docker.sock:/var/run/docker.sock --rm chenzj/dfimage ${imageId}`;

        await exec(command1);
       
        const { stdout } = await exec(command2);
        const [parent, ...arr] = stdout.split(/\n(?=RUN |CMD |ENTRYPOINT|ADD|WORKDIR )/);
    
        const layers = _.zip(answer.RootFS.Layers, arr);

        res.json({
            parent,
            layers
        });
    } catch (error) { 
        res.status(404).send({ error })
    }
});

export default app;