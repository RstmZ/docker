import express, { Express, Request, Response } from 'express';
import _ from 'lodash';
import axios from 'axios'; 

const app: Express = express();

app.use(express.json());

async function getToken(name: string) {
  try {
    const response = await axios.get(`https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/${name}:pull`);

    return response.data.token;
  } catch (error) {
    throw new Error(error as string);
  }
}

async function getDockerfile(name: string, token: string) {
  const manifestUrl = `https://registry-1.docker.io/v2/library/${name}/manifests/latest`;

  const manifestResponse = await axios.get(manifestUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  const { fsLayers, history } = manifestResponse.data;

  const layers = []

  for (let index = 0; index < fsLayers.length; index++) {
    const element = fsLayers[index];
    layers.push(element.blobSum)
  }
  const commands = []
  for (let index = 0; index < history.length; index++) {
    const element = JSON.parse(history[index].v1Compatibility);

    const cmd = element.container_config.Cmd;
    commands.push(cmd)
  }

  return _.zip(layers, commands);
}

app.post('/', async (req: Request, res: Response) => {
  try {
    const name = req.body.name;

    const token = await getToken(name);
 
    const layers = await getDockerfile(name, token);

    res.json({
      parent: '',
      layers
    });
  } catch (error) {
    res.status(404).send({ error })
  }
});

export default app;