import { Command, flags } from '@oclif/command';
import fs from 'fs';
import OsuParser from 'osu-json-parser';
import path from 'path';
import readline from 'readline';
import parseRGB from './parseRGB';

async function start(
  file: string,
  name: string,
  musicExt: string,
  offset: number
): Promise<void> {
  let filepath = `${path.basename(name)}.inc`;
  filepath = path.join(path.dirname(file), filepath);
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
  });

  const parser = new OsuParser();

  return new Promise((resolve) => {
    rl.on('line', (line) => {
      parser.parse(line);
    });

    rl.on('close', () => {
      const scripts = parseRGB(
        name,
        parser.toJSON(),
        musicExt.replace('.', ''),
        offset
      );
      fs.writeFileSync(filepath, scripts);
      // const scripts = JSON.stringify(parser.toJSON(), null, 2);
      // fs.writeFileSync(filepath, scripts);
      resolve();
    });
  });
}

class RGBOsu extends Command {
  public static description = 'OSU! 채보를 RGB 채보로 변환합니다.';

  public static flags = {
    name: flags.string({
      char: 'n',
      required: true,
      description: '음원 이름 (example.mp3)',
    }),
    offset: flags.string({ char: 'o', description: 'offset (milliseconds)' }),
  };

  public static args = [{ name: 'file' }];

  public async run() {
    const { args, flags } = this.parse(RGBOsu);

    if (args.file) {
      const offset = Number(flags.offset);
      const name = flags.name.replace(/[^\x00-\x7F]/g, '');
      start(
        args.file,
        path.basename(name, path.extname(name)),
        path.extname(name),
        Number.isNaN(offset) ? 0 : offset
      );
    }
  }
}

export = RGBOsu;
