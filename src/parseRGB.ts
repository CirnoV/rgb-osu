import {
  IOsuData,
  ISampleInfo,
  ITimingPoint,
} from 'osu-json-parser/dist/OsuParser';

const rgbDelay = 1.775;

function parseRGB(
  name: string,
  osu: IOsuData,
  musicExt: string,
  offset: number
): string {
  const musicScripts: string[] = parseOsu(osu, offset);
  return makePawnFunction(name, musicScripts, musicExt);
}

function makePawnFunction(
  name: string,
  musicScripts: string[],
  musicExt: string
): string {
  const scripts: string[] = [];
  // scripts.push("#include \"rgb/base.inc\"");
  // scripts.push("");
  scripts.push(`public void Start_${name}()`);
  scripts.push('{');
  scripts.push(
    `  CreateTimer(${rgbDelay}, MUSICSTART, _, TIMER_FLAG_NO_MAPCHANGE);`
  );
  scripts.push(musicScripts.map((str) => `  ${str}`).join('\n'));
  scripts.push('}');
  return scripts.join('\n');
}

function parseOsu(osu: IOsuData, offset: number = 0): string[] {
  const {
    difficulty: { SliderMultiplier },
    timingPoints: _timingPoints,
    hitObjects,
  } = osu;
  const scripts: string[] = hitObjects.flatMap((hitobject) => {
    const { StartTime, RepeatCount, Samples, NodeSamples } = hitobject;
    let timingPoints = _timingPoints
      .filter(({ Time }) => Time < StartTime)
      .sort(({ Time }) => Time)
      .reverse();
    if (timingPoints.length === 0) {
      timingPoints = _timingPoints.sort(({ Time }) => Time);
    }
    const currentTimingPoint = timingPoints[0];

    const time = (StartTime + offset) / 1000;
    if (RepeatCount !== undefined && RepeatCount >= 0) {
      const [{ BeatLength: beatLength }] = timingPoints.filter(
        ({ BeatLength }) => BeatLength
      );
      const [{ SpeedMultiplier: speedMultiplier }] = timingPoints;

      const { Length = 0 } = hitobject;
      const sliderDuration =
        (Length / (100.0 * SliderMultiplier)) * (beatLength! * speedMultiplier);
      const scripts: string[] = [];
      for (let i = 0; i < RepeatCount + 2; i++) {
        const sliderTick = beatLength! * speedMultiplier;
        const tickNum: number = Math.floor(sliderDuration / sliderTick);
        if (i > 0) {
          for (let x = 0; x < tickNum; x++) {
            const tickTiming =
              time + (sliderDuration * (i - 1) + tickNum * sliderTick) / 1000;

            if (
              Math.abs(tickTiming - (time + (sliderDuration * i) / 1000)) <
              Number.EPSILON
            ) {
              continue;
            }
            scripts.push(CreateNoteScript(tickTiming, [{ Name: 'hitnormal' }]));
          }
        }
        scripts.push(
          CreateNoteScript(time + (sliderDuration * i) / 1000, NodeSamples![i])
        );
      }
      return scripts;
    }
    return CreateNoteScript(time, Samples!);
  });
  return scripts;
}

function CreateNoteScript(time: number, samples: ISampleInfo[]): string {
  const flags = {
    hitnormal: 'Normal',
    hitwhistle: 'Symbols',
    hitfinish: 'Symbols',
    hitclap: 'Clap',
  } as { [key: string]: string };

  const noteSamples: string[] = samples.map(({ Name: name = 'hitnormal' }) => {
    return `${flags[name]}_Note_Array`;
  });

  let note = noteSamples
    .map((note) => `PushArrayCell(${note}, ${time.toFixed(4)});`)
    .join('\n  ');

  return note;
}

export default parseRGB;
