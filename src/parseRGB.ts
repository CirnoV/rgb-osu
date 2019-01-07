import { IOsuData } from "osu-json-parser/dist/OsuParser";

function parseRGB(osu: IOsuData): string[] {
  const {difficulty: {SliderMultiplier}, timingPoints, hitObjects} = osu;
  const rgbTimers: string[] = hitObjects.map((hitobject) => {
    const timingPoint = timingPoints.filter(({Time}) => Time < hitobject.StartTime).sort(({Time}) => Time);
    return "CreateTimer();";
  });

  return rgbTimers;
}

export default parseRGB;
