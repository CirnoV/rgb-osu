import { IOsuData, ISampleInfo, ITimingPoint } from "osu-json-parser/dist/OsuParser";

const rgbDelay = 1.5781;

function parseRGB(name: string, osu: IOsuData, musicExt: string, offset: number): string {
  const musicScripts: string[] = parseOsu(osu, offset);
  return makePawnFunction(name, musicScripts, musicExt);
}

function makePawnFunction(name: string, musicScripts: string[], musicExt: string): string {
  const scripts: string[] = [];
  scripts.push("#include \"rgb/base.inc\"");
  scripts.push("");
  scripts.push(`public void Start_${name}()`);
  scripts.push("{");
  scripts.push(`  StartMusic(${(0).toFixed(1)}, "${name}.${musicExt}");`);
  scripts.push(musicScripts.map((str) => `  ${str}`).join("\n"));
  scripts.push("}");
  return scripts.join("\n");
}

function parseOsu(osu: IOsuData, offset: number = 0): string[] {
  const {difficulty: {SliderMultiplier}, timingPoints: _timingPoints, hitObjects} = osu;
  const scripts: string[] = hitObjects.flatMap((hitobject) => {
    const {StartTime, RepeatCount, Samples, NodeSamples} = hitobject;
    let timingPoints = _timingPoints
      .filter(({Time}) => Time < StartTime)
      .sort(({Time}) => Time)
      .reverse();
    if (timingPoints.length === 0) {
      timingPoints = _timingPoints.sort(({Time}) => Time);
    }
    const currentTimingPoint = timingPoints[0];

    const time = (StartTime + offset) / 1000;
    if (RepeatCount !== undefined && RepeatCount >= 0) {
      const [{BeatLength: beatLength}] = timingPoints
        .filter(({BeatLength}) => BeatLength);
      const [{SpeedMultiplier: speedMultiplier}] = timingPoints;

      const {Length = 0} = hitobject;
      const sliderDuration = Length / (100.0 * SliderMultiplier) * (beatLength! * speedMultiplier) / 1000;
      const scripts: string[] = [];
      for (let i = 0; i < RepeatCount + 2; i++) {
        scripts.push(CreateNoteScript(time + (sliderDuration * i), currentTimingPoint, NodeSamples![i]));
      }
      return scripts;
    }
    return CreateNoteScript(time, currentTimingPoint, Samples!);
  });
  return scripts;
}

function CreateNoteScript(time: number, timingPoint: ITimingPoint, samples: ISampleInfo[]): string {
  const {SampleBank: sampleBank, SampleVolume: volume} = timingPoint;
  const flags = {
    hitnormal: "NORMAL",
    hitwhistle: "WHISTLE",
    hitfinish: "FINISH",
    hitclap: "CLAP",
  } as {[key: string]: string};
  const banks = {
    normal: "NORMAL",
    soft: "SOFT",
    drum: "DRUM",
  } as {[key: string]: string};

  const noteSamples: string[] = samples.map(({Bank: bank, Name: name = "hitnormal"}) => {
    return `NOTE_${banks[bank || sampleBank]}_${flags[name]}`;
  });

  let soundVolume;
  if (samples[0].Volume) {
    soundVolume = samples[0].Volume;
  } else {
    soundVolume = volume;
  }
  soundVolume = (soundVolume / 100).toFixed(1);
  // tslint:disable-next-line:max-line-length
  return `Note(${time.toFixed(4)}, ${noteSamples.join("|")}, ${soundVolume});`;
}

export default parseRGB;
