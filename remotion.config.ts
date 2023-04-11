import { Config } from 'remotion';

Config.Output.setCodec('h264');
Config.Output.setImageSequence(false);
Config.Rendering.setImageFormat('jpeg');

//npx remotion preview ./video/src/index.tsx --props=./props.json
//npx remotion render ./video/src/index.tsx Main out.mp4 --props=./props.json
