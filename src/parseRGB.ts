import { IOsuData, ISampleInfo } from "osu-json-parser/dist/OsuParser";

function parseRGB(osu: IOsuData, offset: number = 0): string[] {
  const {difficulty: {SliderMultiplier}, timingPoints: _timingPoints, hitObjects} = osu;
  const rgbTimers: string[] = hitObjects.flatMap((hitobject) => {
    const {StartTime, RepeatCount, Samples, NodeSamples} = hitobject;
    let timingPoints = _timingPoints
      .filter(({Time}) => Time < StartTime)
      .sort(({Time}) => Time)
      .reverse();
    if (timingPoints.length === 0) {
      timingPoints = _timingPoints.sort(({Time}) => Time);
    }
    const [{SampleVolume}] = timingPoints;

    const time = (StartTime + offset) / 1000;
    if (RepeatCount !== undefined && RepeatCount >= 0) {
      const [{BeatLength: beatLength}] = timingPoints
        .filter(({BeatLength}) => BeatLength);
      const [{SpeedMultiplier: speedMultiplier}] = timingPoints;

      const {Length = 0} = hitobject;
      const sliderDuration = Length / (100.0 * SliderMultiplier) * (beatLength! * speedMultiplier) / 1000;
      const scripts: string[] = [];
      for (let i = 0; i < RepeatCount + 2; i++) {
        scripts.push(CreateNoteScript(time + (sliderDuration * i), NodeSamples![i], SampleVolume));
      }
      return scripts;
    }
    return CreateNoteScript(time, Samples!, SampleVolume);
  });

  return ["DataPack pack;", ...rgbTimers];
}

function CreateNoteScript(time: number, samples: ISampleInfo[], volume: number): string {
  const flags = {
    hitnormal: "NOTESAMPLE_NORMAL",
    hitwhistle: "NOTESAMPLE_WHISTLE",
    hitfinish: "NOTESAMPLE_FINISH",
    hitclap: "NOTESAMPLE_CLAP",
  } as {[key: string]: string};
  return `Note(${time}, 0, ${samples.map(({Name}) => flags[Name!]).join("|")}, ${volume / 100});`;
}

export default parseRGB;
